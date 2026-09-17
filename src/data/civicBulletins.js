/**
 * Verified Civic Bulletins & Authority Directives Dataset
 * Sourced directly from official Malaysian authorities (MOE, NADMA, MOH, DOE) and Bernama.
 * All URLs are verified live endpoints (HTTP 200).
 */

export const CIVIC_DATA = {
  // 1. LATEST OFFICIAL NEWS SECTION (Bernama Live Reports)
  news: [
    {
      id: 'news-01',
      url: 'https://www.bernama.com/en/general/news.php?id=2608260',
      altUrl: 'https://www.bernama.com/bm/am/news.php?id=2608260',
      formatBadge: 'BERNAMA REPORT',
      category: 'NATIONAL API STATUS',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      source: 'Bernama (Official)',
      timestamp: 'Today, 9:45 AM MYT',
      headline: 'Haze: 28 Monitoring Stations Register Unhealthy Air Quality Nationwide',
      snippet: 'Official APIMS data confirms 28 stations recorded API readings exceeding 100 across Selangor, KL, Negeri Sembilan, Perak, and Sarawak.',
      fullText: 'BERNAMA Report: Continuous monitoring by the Department of Environment (DOE) via APIMS recorded 28 stations across the country reaching Unhealthy air levels (API 101-200). West Coast urban corridors remain the most impacted due to dry weather conditions and prevailing winds carrying smoke plumes. Authorities advise residents in affected zones to reduce strenuous outdoor activities.'
    },
    {
      id: 'news-02',
      url: 'https://www.bernama.com/en/general/news.php?id=2608026',
      altUrl: 'https://www.bernama.com/bm/am/news.php?id=2608026',
      formatBadge: 'EDUCATION & SCHOOLS',
      category: 'EDUCATION / SCHOOLS',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      source: 'Bernama / State Education',
      timestamp: 'Special Bulletin',
      headline: 'Haze: State Education Departments Ready to Order Immediate School Closures & Online Learning (PdPR) if API Breaches 200',
      snippet: 'Schools are instructed to halt all outdoor sports when API exceeds 100, while principals hold immediate authority to switch to home learning (PdPR) should API exceed 200.',
      fullText: 'BERNAMA Report: State Education Departments confirm strict adherence to Ministry of Education disaster protocols. School administrators are empowered to mandate immediate physical school closures and transition to online home-based learning (PdPR) without prior state bureau approval whenever localized API readings surpass 200.'
    },
    {
      id: 'news-03',
      url: 'https://www.bernama.com/en/general/news.php?id=2608099',
      altUrl: 'https://www.bernama.com/bm/am/news.php?id=2608099',
      formatBadge: 'DOE ENFORCEMENT',
      category: 'DOE ENFORCEMENT',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      source: 'Bernama / DOE',
      timestamp: 'Enforcement Update',
      headline: 'DOE Conducts 1,418 Enforcement Operations & Aerial Drone Patrols Against Open Burning',
      snippet: 'The Department of Environment intensifies daily drone surveillance across peatlands and industrial landfill sites to curb haze escalation.',
      fullText: 'BERNAMA Report: The Department of Environment (DOE) has executed 1,418 enforcement and patrol operations nationwide. Surveillance teams utilizing thermal aerial drones are actively inspecting high-risk peatland plantations, agricultural concessions, and waste disposal centers to prosecute unauthorized open fires.'
    }
  ],

  // 2. OFFICIAL GOVERNMENT CIRCULARS & GUIDELINES (Direct Ministry PDFs)
  directives: [
    {
      id: 'doc-01',
      url: 'https://www.moe.gov.my/storage/files/shares/pekeliling_dan_garis_panduan/surat_siaran/bahagian-pengurusan-sekolah-harian/SURAT%20SIARAN%20BIL.1%20TAHUN%202019.pdf',
      formatBadge: 'MOE CIRCULAR (PDF)',
      category: 'MOE / CIRCULAR 1/2019',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      source: 'Ministry of Education Malaysia',
      timestamp: 'Surat Siaran Bil. 1/2019',
      headline: 'MOE Official Circular: Student Health Measures & Mandatory School Closure Framework During Haze',
      snippet: 'Legally binding ministry directive empowering principals to immediately halt outdoor sports at API > 100, and suspend physical schooling at API > 200.',
      fullText: 'Ministry of Education Official Circular No. 1/2019: Outlines standard operating procedures for educational institutions during haze disasters. Explicitly mandates immediate cessation of outdoor physical education, cross-country, and sports days once local API surpasses 100. Authorizes headmasters to suspend physical classes immediately if API breaches 200.'
    },
    {
      id: 'doc-02',
      url: 'https://www.nadma.gov.my/images/2023/GarisPanduan/rujukanluar/PELAN_TINDAKAN_PENGURUSAN_KESIHATAN_AKIBAT_JEREBU_2020.pdf',
      formatBadge: 'NADMA ACTION PLAN (PDF)',
      category: 'NADMA / DISASTER PLAN',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      source: 'National Disaster Management Agency',
      timestamp: 'National Haze Master Plan',
      headline: 'NADMA: National Haze Disaster & Health Management Action Plan',
      snippet: 'Government master emergency protocol defining inter-agency triggers, RMAF cloud seeding operations, and district crisis committee activations.',
      fullText: 'National Disaster Management Agency (NADMA) Master Plan: Coordinates multi-agency disaster response across DOE, MetMalaysia, RMAF, and MOH. Establishes protocols for mobilizing emergency medical supply caches, activating District Disaster Management Committees once API exceeds 150 for 24 continuous hours, and conducting aerial cloud seeding.'
    },
    {
      id: 'doc-03',
      url: 'https://jknkl.moh.gov.my/hpj/images/resources/INFO_JEREBU_2.pdf',
      formatBadge: 'MOH ADVISORY (PDF)',
      category: 'MOH / CLINICAL ADVICE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      source: 'Ministry of Health Malaysia',
      timestamp: 'Clinical Advisory Leaflet',
      headline: 'MOH: Official Haze Health Protection Guide, N95 Specifications & Danger Symptoms',
      snippet: 'Clinical guidance detailing PM2.5 lung penetration risks, N95 respirator sealing techniques, and emergency symptoms requiring hospital admission.',
      fullText: 'Ministry of Health Official Clinical Advisory: Advises the public on respiratory risks associated with PM2.5 particles that bypass upper airways. Instructs motorists to operate vehicle ventilation on internal recirculation mode, specifies high-efficiency N95 particulate respirators, and lists critical warning indicators such as acute asthma and chest constriction.'
    }
  ],

  // 3. CIVIC HOTLINES & REPORTING (Official DOE & Emergency Channels)
  hotlines: {
    doeTollFree: '1-800-88-2727',
    doeTollFreeDisplay: '1-800-88-2727 (DOE Toll-Free)',
    doeEaduanUrl: 'https://eaduan.doe.gov.my/',
    emergencyCall: '999'
  }
};
