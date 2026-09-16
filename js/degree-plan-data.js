(function(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BracuDegreePlanData = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";
  function course(code, title, credits = 3, note = "") { return { code, title: title.replace(/\*$/, ""), credits, note }; }
      var streamData=[
        {id:"stream-1",title:"Stream 1: Writing Comprehension",subtitle:"Any 2 ENG courses required (ENG091 is excluded)",required:2,requiredCourses:[course("ENG091","Foundation Course",0,"Non-Credit Course")],choices:[course("ENG101","English Fundamentals"),course("ENG102","English Composition I"),course("ENG103","Advanced Writing Skills and Presentation*",3,"*Only for ENG102 freshers")]},
        {id:"stream-2",title:"Stream 2: Math and Natural Sciences",subtitle:"Minimum 2 courses required (MAT092 is excluded)",required:2,requiredCourses:[course("MAT092","Remedial Course in Mathematics",0,"Non-Credit Course"),course("MAT110","MATH I: Differential Calculus and Co-ordinate Geometry"),course("PHY111","Principles of Physics I"),course("STA201","Elements of Statistics and Probability")],choices:[course("BIO101","Introduction to Biology"),course("CHE101","Introduction to Chemistry"),course("CSE101","Introduction to Computer Science"),course("ENV103","Elements of Environmental Science"),course("GSC110","Space, Time & Infinity"),course("MAT101","Fundamentals of Mathematics"),course("PHY101","Introduction to Physics"),course("STA101","Introduction to Statistics")]},
        {id:"stream-3",title:"Stream 3: Arts and Humanities",subtitle:"BNG103 & HUM103 compulsory, then minimum 1 additional course",required:3,requiredCourses:[course("BNG103","Bangla Language and Literature",3,"Compulsory"),course("HUM103","Ethics and Culture",3,"Compulsory")],choices:[course("ENG110","English for Life"),course("ENG113","Introduction to English Poetry"),course("ENG114","Introduction to English Drama"),course("ENG115","Introduction English Prose"),course("ENG333","Globalization and the Media"),course("HST102","The Modern World"),course("HST103","History of Bangladesh"),course("HST104","Global History Lab — A History of World since 1300"),course("HUM101","World Civilization & Culture"),course("HUM102","Introduction to Philosophy"),course("HUM104","Religions of the World"),course("HUM110","World Cinema"),course("HUM201","Eastern Philosophies"),course("HUM207","Narratives of Truth and Lies"),course("HUM210","Streaming Media Cultures"),course("HUM301","In the Archives")]},
        {id:"stream-4",title:"Stream 4: Social Sciences",subtitle:"EMB101 compulsory, then minimum 1 additional course",required:2,requiredCourses:[course("EMB101","Emergence of Bangladesh",3,"Compulsory")],choices:[course("ANT101","Introduction to Anthropology"),course("ANT342","Body and Society"),course("ANT351","Gender & Development"),course("BU201","Community Engagement and Action"),course("BUS102","Business — Basics, Ethics and Environment"),course("BUS201","Business and Human Communication"),course("BUS333","Social Entrepreneurship Practicum"),course("BUS335","Sustainable Development and Social Enterprise"),course("DEV104","Foundations of International Development"),course("DEV201","Health, Culture and Development"),course("ECO101","Introduction to Microeconomics"),course("ECO102","Introduction to Macroeconomics"),course("ECO105","Introduction to Economics"),course("POL101","Introduction to Political Science"),course("POL102","Comparative Governance"),course("POL103","International Relations and Global Politics"),course("POL201","Introduction to Civic Engagement"),course("POL202","Foundations in Public Policy"),course("POL203","Political Theory"),course("POL210","Youth and Global Movement"),course("PSY101","Introduction to Psychology"),course("PSY102","Understanding the Human Minds"),course("SOC101","Introduction to Sociology"),course("SOC201/ANT202","Social Inequality")]},
        {id:"stream-5",title:"Stream 5: Communities, Seeking Transformation",subtitle:"Minimum 1 course required",required:1,requiredCourses:[],choices:[course("BUS334","Social Intrapreneurship Practicum — Leading Change"),course("CST201","Luxury and Oppression in a Globalized World (of Perfumes)"),course("CST204","Communication for Social Change"),course("CST301","For the Love of Food"),course("CST302","The Pursuit of Wellbeing"),course("CST303","Law for Life, Peace and Justice"),course("CST304","Documentary Film: Theory and Practice"),course("CST305","Borders and Beyond: Past and Future"),course("CST306","Ethical Leadership"),course("CST307","Art, Community and the Future"),course("CST308","Social Dimensions of Faith and Development"),course("CST309","Global Citizenship"),course("CST310","Social Cohesion and Peace Building"),course("CST314","Visual Storytelling: Understanding Society through Documentary Film"),course("CST333","Personal Finance for Sustainable Economic Wellbeing")]}
      ];
      var fixedSections=[
        {id:"school-core",title:"School Core",subtitle:"All listed courses must be completed",required:12,courses:[course("MAT120","MATH II: Integral Calculus and Differential Equations"),course("MAT215","MATH III: Complex Variables and Laplace Transformations"),course("MAT216","MATH IV: Linear Algebra and Fourier Analysis"),course("PHY112","Principles of Physics II")]},
        {id:"program-core",title:"Program Core",subtitle:"All listed courses must be completed",required:48,courses:[course("CSE110","Programming Language I"),course("CSE111","Programming Language II"),course("CSE220","Data Structures"),course("CSE221","Algorithms"),course("CSE230","Discrete Mathematics"),course("CSE260","Digital Logic Design"),course("CSE321","Operating Systems"),course("CSE330","Numerical Methods"),course("CSE331","Automata and Computability"),course("CSE340","Computer Architecture"),course("CSE370","Database Systems"),course("CSE420","Compiler Design"),course("CSE421","Computer Networks"),course("CSE422","Artificial Intelligence"),course("CSE423","Computer Graphics"),course("CSE470","Software Engineering")]},
        {id:"project",title:"Project / Internship / Thesis",subtitle:"All listed courses must be completed",required:4,courses:[course("CSE400","Final-Year Project / Internship / Thesis",4)]}
      ];
      var cseElectives=[course("CSE250","Circuits and Electronics"),course("CSE251","Electronic Devices and Circuits"),course("CSE310","Object Oriented Programming"),course("CSE320","Data Communication"),course("CSE341","Microprocessor"),course("CSE342","Computer Systems Engineering"),course("CSE350","Digital Electronics and Pulse Techniques"),course("CSE360","Computer Interface"),course("CSE390","Technical Communication"),course("CSE391","Programming for the Internet"),course("CSE392","Signals and Systems"),course("CSE410","Advance Programming In UNIX"),course("CSE419","Programming Languages"),course("CSE424","Pattern Recognition"),course("CSE425","Neural Networks"),course("CSE426","Basic Graph Theory"),course("CSE427","Machine Learning"),course("CSE428","Image Processing"),course("CSE429","Basic Multimedia Theory"),course("CSE430","Digital Signal Processing"),course("CSE431","Natural Language Processing"),course("CSE432","Speech Recognition and Synthesis"),course("CSE460","VLSI Design"),course("CSE461","Digital System Design"),course("CSE462","Fault Tolerant Systems"),course("CSE471","System Analysis and Design"),course("CSE472","Human Computer Interface"),course("CSE473","Decision Support System"),course("CSE474","Simulation and Modeling"),course("CSE490","Special Topics"),course("CSE491","Independent Study"),course("CSE490A","Gamification: Engineering User Engagement"),course("CSE490B","Introduction to Cybersecurity"),course("CSE490D","Introduction to Football Data and Analytics"),course("CSE490E","Information and Coding Theory"),course("CSE490F","Biomedical Signal and Image Analysis")];

  const streamCategories = ["stream-1-writing", "stream-2-math-and-natural-sciences", "stream-3-arts-and-humanities", "stream-4-social-sciences", "stream-5-communities-seeking-transformation"];
  const aliases = { ANT202: "SOC201", "SOC201/ANT202": "SOC201" };
  const alternatives = {
    CSE110: [["CSE161", "CSE162L"], ["EEE103", "EEE103L"], ["ECE103", "ECE103L"]],
    CSE260: [["EEE283", "EEE283L"], ["ECE283", "ECE283L"], ["EEE301", "EEE302"]]
  };
  const legacyArts = ["ACT201","ACT202","BUS101","BUS202","BCH101","BTE101","CHE110","CHN101","FRN101","FIN301","GEO101","LAW101","HUM111","HST407","STA301"];
  const normalize = code => String(code || "").trim().toUpperCase().replace(/\s+/g, "").replace(/\*$/, "");
  const canonical = code => aliases[normalize(code)] || normalize(code);
  function department(code) {
    if (code.startsWith("CSE")) return "CSE";
    if (/^(ENG|BNG|CHN|FRN)/.test(code)) return "BIL";
    if (/^(MAT|PHY|STA|CHE)/.test(code)) return "MPS";
    return "GENED";
  }
  function catalogCourses() {
    const courses = [];
    const add = (row, category) => {
      const codes = row.code === "SOC201/ANT202" ? ["SOC201", "ANT202"] : [row.code];
      codes.forEach(code => courses.push({
        ...row, code, category, department: department(code), visibility: "curriculum",
        roadmapLevel: null, roadmapOrder: null, isRoadmapSlot: false,
        hardPrerequisites: [], softPrerequisites: [], sourceNote: "Approved CS degree plan"
      }));
    };
    streamData.forEach((stream, i) => [...stream.requiredCourses, ...stream.choices].forEach(row => add(row, streamCategories[i])));
    fixedSections.forEach(section => section.courses.forEach(row => add(row, section.id === "project" ? "thesis-project" : section.id)));
    cseElectives.forEach(row => add(row, "program-elective"));
    return courses;
  }
  function mergeCourses(existing = [], { overwrite = false } = {}) {
    const result = existing.map(row => ({ ...row }));
    catalogCourses().forEach(row => {
      const index = result.findIndex(item => normalize(item.code) === row.code);
      if (index < 0) result.push(row);
      else if (overwrite) result[index] = { ...result[index], title: row.title, credits: row.credits, category: row.category };
    });
    return result;
  }
  return Object.freeze({ streams: streamData, fixedSections, cseElectives, streamCategories, aliases, alternatives, legacyArts, normalize, canonical, catalogCourses, mergeCourses });
});
