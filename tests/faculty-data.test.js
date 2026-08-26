const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { DEFAULT_DATA } = require("../js/data.js");

const APPROVED_FACULTY_INITIALS = [
  "AAR",
  "ACH",
  "ADU",
  "AFQ",
  "AIB",
  "AJA",
  "AKJ",
  "AKTD",
  "ALB",
  "AMK",
  "ANKH",
  "ANWE",
  "AQT",
  "AQU",
  "ARD",
  "ARF",
  "ARPD",
  "ART",
  "ASA",
  "ASAK",
  "ASRF",
  "ATY",
  "AVB",
  "AYO",
  "BDH",
  "BIJS",
  "CMR",
  "DFD",
  "DZK",
  "EHQ",
  "ESF",
  "FARS",
  "FDC",
  "FDM",
  "FDZ",
  "FEK",
  "FFU",
  "FFR",
  "FGZ",
  "FIC",
  "FYS",
  "GRA",
  "HFN",
  "HMH",
  "IBA",
  "IBU",
  "IRZA",
  "KHR",
  "KKS",
  "KNI",
  "KYK",
  "KZMN",
  "LBBH",
  "LMI",
  "LRK",
  "MAF",
  "MAFZ",
  "MAHR",
  "MAHS",
  "MAJIJ",
  "MAO",
  "MAZW",
  "MDF",
  "MHDE",
  "MHSK",
  "MHY",
  "MNY",
  "MOM",
  "MRIA",
  "MSA",
  "MSAH",
  "MSMA",
  "MTOT",
  "MTSM",
  "MUNR",
  "MVH",
  "MZW",
  "NAFR",
  "NAHC",
  "NARC",
  "NAST",
  "NBD",
  "NDT",
  "NFF",
  "NFMK",
  "NFS",
  "NHBN",
  "NKBS",
  "NKMA",
  "NLAM",
  "NLH",
  "NMMR",
  "NMP",
  "NNTN",
  "NQM",
  "NRHB",
  "NRT",
  "NRZR",
  "NTR",
  "NUR",
  "NWT",
  "NZRF",
  "NZU",
  "PBK",
  "PDS",
  "PLN",
  "PRC",
  "QUZA",
  "RAHA",
  "RAK",
  "RAO",
  "RBR",
  "RDS",
  "RDW",
  "RFF",
  "RFR",
  "RFTS",
  "RKBM",
  "RKBR",
  "RKN",
  "RRH",
  "RSS",
  "SADA",
  "SADF",
  "SAS",
  "SBB",
  "SBHN",
  "SDAS",
  "SDF",
  "SDL",
  "SDQ",
  "SDS",
  "SEF",
  "SHAH",
  "SHBK",
  "SHBZ",
  "SJM",
  "SKIB",
  "SKZ",
  "SLAR",
  "SMDS",
  "SMUR",
  "SMYA",
  "SOSB",
  "SRJ",
  "SRU",
  "SSKD",
  "STNM",
  "SUE",
  "SWG",
  "SWK",
  "SZD",
  "SZZ",
  "TAP",
  "TAV",
  "TAW",
  "THR",
  "TLQ",
  "TMD",
  "TNF",
  "TNMF",
  "TRZ",
  "TRZA",
  "TSE",
  "TSM",
  "TVRR",
  "TWK",
  "UJT",
  "UTKR",
  "WBH",
  "WHMJ",
  "WLV",
  "YND",
  "ZAZ",
  "ZBH",
  "ZBYR",
  "ZHS",
  "ZLNM",
  "ZMD",
  "ZYH"
];

test("approved CSE faculty catalog is complete and duplicate-free", () => {
  const faculties = DEFAULT_DATA.defaultFaculties;
  const byInitial = new Map(faculties.map((faculty) => [faculty.initial, faculty]));

  assert.equal(faculties.length, 193);
  assert.equal(byInitial.size, faculties.length);
  assert.deepEqual(
    APPROVED_FACULTY_INITIALS.filter((initial) => !byInitial.has(initial)),
    [],
  );

  for (const initial of APPROVED_FACULTY_INITIALS) {
    assert.equal(byInitial.get(initial).department, "CSE");
  }
});

test("existing faculty records are preserved while verified corrections are used", () => {
  const byInitial = new Map(
    DEFAULT_DATA.defaultFaculties.map((faculty) => [faculty.initial, faculty]),
  );

  assert.equal(byInitial.get("ADU").name, "Ahmed Mahir Ruhan");
  assert.equal(byInitial.get("DZK").name, "Dewan Ziaul Karim");
  assert.equal(byInitial.get("SHAH").name, "Asif Shahriar");
  assert.equal(byInitial.get("SLAR").name, "Sadiul Arefin Rafi");
  assert.equal(byInitial.get("TRZA").name, "Tanjim Reza");

  assert.deepEqual(
    {
      initial: byInitial.get("MAHR").initial,
      name: byInitial.get("MAHR").name,
      email: byInitial.get("MAHR").email,
    },
    {
      initial: "MAHR",
      name: "Mahrin Tasfe",
      email: "mahrin.tasfe@bracu.ac.bd",
    },
  );
  assert.equal(byInitial.get("IRZA").email, "ext.irtiza.hossain@bracu.ac.bd");
  assert.equal(byInitial.get("FFR").name, "Md. Fatin Ishraq Faruqui");
  assert.equal(byInitial.get("MAJIJ").name, "Majisha Jahan Disha");
  assert.equal(byInitial.get("WHMJ").name, "Wahida Mahjabin");
});

test("verified faculty names and emails remain byte-for-byte stable", () => {
  const canonicalCatalog = DEFAULT_DATA.defaultFaculties
    .map((faculty) =>
      [faculty.initial, faculty.name, faculty.email, faculty.department].join("|"),
    )
    .sort()
    .join("\n");

  assert.equal(
    crypto.createHash("sha256").update(canonicalCatalog).digest("hex"),
    "6743a8d0e57811dd8ee069aec075029026b07bf59d0e8e6358562c77e67e757b",
  );
});
