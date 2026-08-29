const KIND_CONFIG = Object.freeze({
  department: Object.freeze({ table: 'catalog_departments', key: 'id', fields: 'id, name, color' }),
  course: Object.freeze({
    table: 'catalog_courses', key: 'code',
    fields: 'code, title, credits, department, category, visibility, roadmap_level, roadmap_order, hard_prerequisites, soft_prerequisites, source_note, is_roadmap_slot'
  }),
  faculty: Object.freeze({ table: 'catalog_faculties', key: 'initial', fields: 'initial, name, email, department' })
});
const PUBLIC_FIELDS = Object.freeze(Object.fromEntries(
  Object.entries(KIND_CONFIG).map(([kind, config]) => [kind, Object.freeze(config.fields.split(',').map(field => field.trim()))])
));

const DEPARTMENT_ID = /^[A-Z][A-Z0-9_-]{1,15}$/;
const COURSE_CODE = /^[A-Z]{2,6}[0-9]{2,4}([A-Z]|\([A-Z]\))?$/;
const FACULTY_INITIAL = /^[A-Z][A-Z0-9]{1,9}$/;
const CATEGORY = /^[a-z0-9][a-z0-9-]{0,49}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function pickAllowed(source, keys) {
  const input = source && typeof source === 'object' ? source : {};
  return Object.fromEntries(keys.filter(key => Object.hasOwn(input, key)).map(key => [key, input[key]]));
}

function compactUpper(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function cleanText(value, label, { required = false, max = 180 } = {}) {
  const cleaned = String(value || '').trim().replace(/\s+/g, ' ');
  if (required && !cleaned) throw new Error(`${label} is required.`);
  if (cleaned.length > max) throw new Error(`${label} is too long.`);
  return cleaned || null;
}

function cleanNullableEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!email) return null;
  if (email.length > 254 || !EMAIL.test(email)) throw new Error('Enter a valid faculty email address.');
  return email;
}

function cleanDepartmentId(value) {
  const id = compactUpper(value);
  if (!DEPARTMENT_ID.test(id)) throw new Error('Enter a valid department ID.');
  return id;
}

function cleanCourseCode(value) {
  const code = compactUpper(value);
  if (!COURSE_CODE.test(code)) throw new Error('Enter a valid course code.');
  return code;
}

function cleanFacultyInitial(value) {
  const initial = compactUpper(value);
  if (!FACULTY_INITIAL.test(initial)) throw new Error('Enter a valid faculty initial.');
  return initial;
}

function cleanInteger(value, label, { min, max, required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new Error(`${label} is required.`);
    return null;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`Enter a valid ${label.toLowerCase()}.`);
  }
  return number;
}

function cleanCredits(value) {
  if (value === undefined || value === null || value === '') return null;
  if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) {
    throw new Error('Enter valid course credits.');
  }
  const credits = Number(value);
  if (!Number.isFinite(credits) || credits < 0 || credits > 20 || Math.round(credits * 10) !== credits * 10) {
    throw new Error('Enter valid course credits.');
  }
  return credits;
}

function cleanVisibility(value) {
  const visibility = String(value || 'curriculum').trim().toLowerCase();
  if (!['curriculum', 'search_only', 'alternative'].includes(visibility)) {
    throw new Error('Enter a valid student visibility.');
  }
  return visibility;
}

function cleanCourseCodes(value, label) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 30) throw new Error(`${label} must be a short array of course codes.`);
  return [...new Set(value.map(cleanCourseCode))];
}

function cleanCategory(value) {
  const category = String(value || '').trim().toLowerCase();
  if (!CATEGORY.test(category)) throw new Error('Enter a valid course category.');
  return category;
}

function cleanBoolean(value, label) {
  if (value === undefined || value === null) return false;
  if (typeof value !== 'boolean') throw new Error(`${label} must be true or false.`);
  return value;
}

export function assertCatalogManager(actor) {
  if (!actor || !['admin', 'super_admin'].includes(String(actor.role || ''))) {
    throw new Error('An administrator account is required for this action.');
  }
  if (actor.role !== 'super_admin' && !(Array.isArray(actor.permissions) && actor.permissions.includes('catalog.manage'))) {
    throw new Error('Catalog management access is required.');
  }
}

export function normalizeCatalogPayload(payload) {
  const kind = String(payload?.kind || '').trim().toLowerCase();
  if (!Object.hasOwn(KIND_CONFIG, kind)) throw new Error('Choose a valid catalog item type.');

  if (kind === 'department') {
    const input = pickAllowed(payload, ['id', 'name', 'color']);
    const color = String(input.color || 'gray').trim().toLowerCase();
    if (!/^[a-z][a-z0-9-]{0,31}$/.test(color)) throw new Error('Enter a valid department color.');
    return {
      kind,
      item: {
        id: cleanDepartmentId(input.id),
        name: cleanText(input.name, 'Department name', { required: true }),
        color
      }
    };
  }

  if (kind === 'faculty') {
    const input = pickAllowed(payload, ['initial', 'name', 'email', 'department']);
    return {
      kind,
      item: {
        initial: cleanFacultyInitial(input.initial),
        name: cleanText(input.name, 'Faculty name', { required: true }),
        email: cleanNullableEmail(input.email),
        department: cleanDepartmentId(input.department)
      }
    };
  }

  const input = pickAllowed(payload, [
    'code', 'title', 'credits', 'department', 'category', 'roadmapLevel', 'roadmapOrder',
    'hardPrerequisites', 'softPrerequisites', 'sourceNote', 'isRoadmapSlot', 'visibility'
  ]);
  const code = cleanCourseCode(input.code);
  const hardPrerequisites = cleanCourseCodes(input.hardPrerequisites, 'Hard prerequisites');
  const softPrerequisites = cleanCourseCodes(input.softPrerequisites, 'Soft prerequisites');
  if (hardPrerequisites.includes(code) || softPrerequisites.includes(code)) {
    throw new Error('A course cannot require itself.');
  }
  return {
    kind,
    item: {
      code,
      title: cleanText(input.title, 'Course title', { required: true }),
      credits: cleanCredits(input.credits),
      department: cleanDepartmentId(input.department),
      category: cleanCategory(input.category),
      visibility: cleanVisibility(input.visibility),
      roadmap_level: cleanInteger(input.roadmapLevel, 'Roadmap level', { min: 1, max: 30 }),
      roadmap_order: cleanInteger(input.roadmapOrder, 'Roadmap order', { min: 1, max: 100 }),
      hard_prerequisites: hardPrerequisites,
      soft_prerequisites: softPrerequisites,
      source_note: cleanText(input.sourceNote, 'Source note', { max: 500 }),
      is_roadmap_slot: cleanBoolean(input.isRoadmapSlot, 'Roadmap slot')
    }
  };
}

export async function listCatalog({ admin }) {
  const outputs = await Promise.all(Object.entries(KIND_CONFIG).map(async ([kind, config]) => {
    const { data, error } = await admin.from(config.table).select(config.fields).order(config.key, { ascending: true });
    if (error) throw new Error('Could not load the global catalog.');
    return [
      kind === 'faculty' ? 'faculties' : `${kind}s`,
      Array.isArray(data) ? data.map(item => publicItem(kind, item)) : []
    ];
  }));
  return Object.fromEntries(outputs);
}

function publicItem(kind, item) {
  const input = item && typeof item === 'object' ? item : {};
  return Object.fromEntries(PUBLIC_FIELDS[kind].filter(field => Object.hasOwn(input, field)).map(field => [field, input[field]]));
}

function prepareFailureAudit(audit, kind, key) {
  if (!audit || typeof audit !== 'object') return;
  audit.targetId = null;
  audit.beforeValues = { kind, key };
  audit.afterValues = {};
}

function publicRpcError(error, fallback) {
  const message = String(error?.message || '');
  const allowed = new Set([
    'Catalog item is referenced by another catalog record.',
    'The global catalog item was not found.',
    'The selected department does not exist.',
    'Every course prerequisite must already exist in the global catalog.'
  ]);
  return allowed.has(message) ? message : fallback;
}

export async function upsertCatalogItem({ admin, payload, actor, requestId, audit }) {
  assertCatalogManager(actor);
  const { kind, item } = normalizeCatalogPayload(payload);
  prepareFailureAudit(audit, kind, item[KIND_CONFIG[kind].key]);
  const { data, error } = await admin.rpc('mutate_global_catalog', {
    catalog_action: 'upsert', catalog_kind: kind, catalog_item: item,
    actor_id: actor.id, audit_request_id: requestId
  });
  if (error || !data) throw new Error(publicRpcError(error, 'Could not save the global catalog item.'));
  return { kind: data.kind, item: publicItem(kind, data.item) };
}

export async function deleteCatalogItem({ admin, payload, actor, requestId, audit }) {
  assertCatalogManager(actor);
  const { kind, item } = normalizeCatalogDeletePayload(payload);
  const config = KIND_CONFIG[kind];
  const key = item[config.key];
  prepareFailureAudit(audit, kind, key);
  const { data, error } = await admin.rpc('mutate_global_catalog', {
    catalog_action: 'delete', catalog_kind: kind, catalog_item: { [config.key]: key },
    actor_id: actor.id, audit_request_id: requestId
  });
  if (error || !data) throw new Error(publicRpcError(error, 'Could not delete the global catalog item.'));
  return { kind, key, deleted: data.deleted === true };
}

function normalizeCatalogDeletePayload(payload) {
  const kind = String(payload?.kind || '').trim().toLowerCase();
  if (!Object.hasOwn(KIND_CONFIG, kind)) throw new Error('Choose a valid catalog item type.');
  const key = KIND_CONFIG[kind].key;
  const cleaner = kind === 'department' ? cleanDepartmentId : kind === 'course' ? cleanCourseCode : cleanFacultyInitial;
  return { kind, item: { [key]: cleaner(payload?.[key]) } };
}
