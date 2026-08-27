const test = require('node:test');
const assert = require('node:assert/strict');

const Profile = require('../js/profile.js');

test('semester choices use the Dhaka year and create one canonical term-year name', () => {
  assert.equal(
    Profile.getDhakaYear(new Date('2026-12-31T18:30:00.000Z')),
    2027
  );
  const years = Profile.semesterYearOptions(2026);
  assert.equal(years[0], 2036);
  assert.equal(years.at(-1), 2001);
  assert.equal(years.length, 36);
  assert.deepEqual(Profile.parseSemesterName('Fall 2024'), {
    term: 'Fall', year: 2024, name: 'Fall 2024'
  });
  assert.equal(Profile.parseSemesterName('Autumn 2024'), null);
});

test('semester selection rejects incomplete, out-of-range, and duplicate choices but permits the edited row', () => {
  const semesters = [
    { id: 'semester-1', name: 'Fall 2024' },
    { id: 'semester-2', name: 'Spring 2025' },
  ];

  assert.deepEqual(
    Profile.validateSemesterSelection({ term: '', year: 2026, semesters, currentYear: 2026 }),
    { error: 'Select a term and year.' }
  );
  assert.deepEqual(
    Profile.validateSemesterSelection({ term: 'Fall', year: 2037, semesters, currentYear: 2026 }),
    { error: 'Select a year from 2001 to 2036.' }
  );
  assert.deepEqual(
    Profile.validateSemesterSelection({ term: 'fall', year: 2024, semesters, currentYear: 2026 }),
    { error: 'That semester already exists.' }
  );
  assert.deepEqual(
    Profile.validateSemesterSelection({
      term: 'Fall', year: 2024, semesters, excludeId: 'semester-1', currentYear: 2026
    }),
    { value: { term: 'Fall', year: 2024, name: 'Fall 2024' } }
  );
});

test('canonical profile mapping uses database field names and serializable avatar identity only', () => {
  assert.deepEqual(Profile.normalizeCanonicalProfile({
    full_name: 'Student Name',
    email: ' STUDENT@G.BRACU.AC.BD ',
    student_id: '24210009',
    program: 'BSc in Computer Science (CS)',
    starting_term: 'Fall',
    starting_year: 2026,
    avatar_preference: 'custom',
    avatar_path: 'user-1/avatar.webp'
  }), {
    name: 'Student Name',
    email: 'student@g.bracu.ac.bd',
    studentId: '24210009',
    program: 'BSc in Computer Science (CS)',
    university: 'BRAC University',
    startingTerm: 'Fall',
    startingYear: 2026,
    startingSemester: 'Fall 2026',
    avatarPreference: 'custom',
    avatarPath: 'user-1/avatar.webp'
  });
});

test('Google avatar resolution accepts provider metadata without persisting its URL', () => {
  assert.equal(Profile.getGoogleAvatarUrl({ user_metadata: { avatar_url: 'https://google/avatar-a' } }), 'https://google/avatar-a');
  assert.equal(Profile.getGoogleAvatarUrl({ user_metadata: { picture: 'https://google/avatar-b' } }), 'https://google/avatar-b');
  assert.equal(Profile.getGoogleAvatarUrl({ user_metadata: {} }), '');
  const normalized = Profile.normalizeCanonicalProfile({ avatar_preference: 'google' });
  assert.equal('profilePhoto' in normalized, false);
  assert.equal(JSON.stringify(normalized).includes('https://google'), false);
});

test('avatar draft keeps Google, custom, and explicit no-photo choices separate', () => {
  const file = { type: 'image/png', size: 100, name: 'avatar.png' };
  const draft = Profile.createAvatarDraft({
    profile: { avatarPreference: 'google', avatarPath: '' },
    user: { user_metadata: { picture: 'https://google/avatar' } }
  });
  assert.equal(draft.snapshot().avatarPreference, 'google');
  assert.equal(draft.chooseNone().avatarPreference, 'none');
  assert.equal(draft.snapshot().photoFile, null);
  assert.equal(draft.chooseCustom(file).avatarPreference, 'custom');
  assert.equal(draft.snapshot().photoFile, file);
  assert.equal(draft.chooseGoogle().avatarPreference, 'google');
  assert.equal(draft.snapshot().photoFile, null);
  assert.throws(() => draft.chooseCustom({ type: 'image/gif', size: 100 }), /JPEG, PNG, or WebP/);
});

test('avatar runtime downloads private custom photos and revokes temporary URLs', async () => {
  const downloaded = [];
  const revoked = [];
  let objectIndex = 0;
  const client = {
    storage: {
      from(bucket) {
        assert.equal(bucket, 'profile-photos');
        return {
          async download(path) {
            downloaded.push(path);
            return { data: { path }, error: null };
          }
        };
      }
    }
  };
  const runtime = Profile.createAvatarRuntime({
    client,
    urlApi: {
      createObjectURL() { objectIndex += 1; return `blob:avatar-${objectIndex}`; },
      revokeObjectURL(url) { revoked.push(url); }
    }
  });
  const first = await runtime.resolve({ full_name: 'Student', avatar_preference: 'custom', avatar_path: 'user-1/a.webp' }, {});
  const second = await runtime.resolve({ full_name: 'Student', avatar_preference: 'custom', avatar_path: 'user-1/b.webp' }, {});
  assert.equal(first.src, 'blob:avatar-1');
  assert.equal(second.src, 'blob:avatar-2');
  assert.deepEqual(downloaded, ['user-1/a.webp', 'user-1/b.webp']);
  assert.deepEqual(revoked, ['blob:avatar-1']);
  runtime.dispose();
  assert.deepEqual(revoked, ['blob:avatar-1', 'blob:avatar-2']);
});

test('explicit none and failed custom avatar never fall back to Google', async () => {
  const client = { storage: { from() { return { async download() { return { data: null, error: new Error('missing') }; } }; } } };
  const runtime = Profile.createAvatarRuntime({ client, urlApi: { createObjectURL() {}, revokeObjectURL() {} } });
  const user = { user_metadata: { avatar_url: 'https://google/avatar' } };
  const none = await runtime.resolve({ full_name: 'Student Name', avatar_preference: 'none' }, user);
  const missing = await runtime.resolve({ full_name: 'Student Name', avatar_preference: 'custom', avatar_path: 'user-1/missing.webp' }, user);
  assert.deepEqual(none, { kind: 'initials', src: '', initials: 'SN', external: false, error: null });
  assert.equal(missing.kind, 'initials');
  assert.equal(missing.src, '');
  assert.match(missing.error.message, /missing/);
});

test('profile service rolls back a new custom upload when the RPC fails', async () => {
  const removed = [];
  let rpcPayload;
  const client = {
    storage: {
      from() {
        return {
          async upload() { return { error: null }; },
          async remove(paths) { removed.push(...paths); return { error: null }; }
        };
      }
    },
    async rpc(name, payload) {
      assert.equal(name, 'update_student_profile');
      rpcPayload = payload;
      return { data: null, error: new Error('RPC failed') };
    }
  };
  const service = Profile.createProfileService({
    client,
    getSessionContext: async () => ({
      user: { id: 'user-1' },
      profile: { avatar_preference: 'google', avatar_path: null }
    }),
    compressPhoto: async () => ({ type: 'image/webp' }),
    clock: () => 123,
    nonce: () => 'abc'
  });
  await assert.rejects(() => service.updateStudentProfile({
    studentId: '24210009',
    program: 'BSc in Computer Science (CS)',
    startingTerm: 'Fall',
    startingYear: 2026,
    avatarPreference: 'custom',
    photoFile: { type: 'image/png', size: 100 }
  }), /RPC failed/);
  assert.equal(rpcPayload.avatar_path, 'user-1/avatar-123-abc.webp');
  assert.equal(rpcPayload.avatar_preference, 'custom');
  assert.deepEqual(removed, ['user-1/avatar-123-abc.webp']);
});
