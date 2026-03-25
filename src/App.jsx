import { useState, useCallback, useRef } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

// ── CONSTANTS ──────────────────────────────────────────────────────
const COUNTRIES = {
  MY: { name:"Malaysia",  flag:"🇲🇾", symbol:"RM",  currency:"MYR", usdRate:4.47  },
  SG: { name:"Singapore", flag:"🇸🇬", symbol:"S$",  currency:"SGD", usdRate:1.35  },
  TH: { name:"Thailand",  flag:"🇹🇭", symbol:"฿",   currency:"THB", usdRate:34.5  },
  ID: { name:"Indonesia", flag:"🇮🇩", symbol:"Rp",  currency:"IDR", usdRate:16300 },
};
const ORG_SIZES = [
  { id:"sme",        label:"SME",             desc:"< 250 employees",  icon:"🏪" },
  { id:"midmarket",  label:"Mid-Market",       desc:"250–1,000",        icon:"🏢" },
  { id:"enterprise", label:"Large Enterprise", desc:"1,000–5,000",      icon:"🏙️" },
  { id:"mnc",        label:"MNC",              desc:"5,000+ employees", icon:"🌐" },
];
const INDUSTRIES = ["Financial Services","Insurance","Healthcare","Manufacturing","Retail & E-commerce","Telco","Energy & Utilities","Government","Education","Technology","Other"];
const COUNTRY_BASE = { MY:2.5, SG:3.1, TH:2.7, ID:2.6 };
const INDUSTRY_DELTA = { "Financial Services":0.6,"Insurance":0.4,"Telco":0.3,"Technology":0.2,"Energy & Utilities":0.1,"Government":0.0,"Healthcare":-0.1,"Manufacturing":-0.3,"Retail & E-commerce":-0.4,"Education":-0.4,"Other":0.0 };
const DOMAIN_DELTA = {
  "Financial Services":{ CY1:0.2,CY2:0.1,CY3:-0.1,CY4:0.0,CY5:0.2,CY6:0.3,CY7:0.0,CY8:-0.1,CY9:0.1 },
  "Healthcare":        { CY1:0.0,CY2:0.1,CY3:0.1,CY4:-0.1,CY5:0.2,CY6:0.1,CY7:-0.1,CY8:-0.2,CY9:-0.1 },
  "Manufacturing":     { CY1:-0.1,CY2:-0.1,CY3:0.0,CY4:-0.2,CY5:0.2,CY6:-0.2,CY7:0.1,CY8:-0.2,CY9:-0.1 },
  "Telco":             { CY1:0.1,CY2:0.1,CY3:0.0,CY4:0.0,CY5:0.2,CY6:0.1,CY7:0.2,CY8:0.2,CY9:0.2 },
};

// ── COMPLIANCE MODULES ─────────────────────────────────────────────
const COMPLIANCE_MODULES = [
  { id:"pdpa", name:"PDPA", full:"Personal Data Protection Act 2010", flag:"🇲🇾", icon:"🔐", color:"#1D4ED8", regulator:"Ministry of Digital",
    desc:"Malaysia's framework for processing personal data in commercial transactions.",
    requirements:[
      { id:"pdpa_1",code:"P.1",name:"Data Collection & Consent",desc:"Personal data collected only with explicit consent and for lawful, specified purposes.",weight:3 },
      { id:"pdpa_2",code:"P.2",name:"Data Retention & Disposal",desc:"Retention schedule defined; personal data disposed securely when no longer needed.",weight:3 },
      { id:"pdpa_3",code:"P.3",name:"Data Subject Rights",desc:"Processes for access, correction, and withdrawal of consent within mandated timeframes.",weight:3 },
      { id:"pdpa_4",code:"P.4",name:"Breach Notification",desc:"Documented process to notify affected individuals and regulator within required timeframe.",weight:3 },
      { id:"pdpa_5",code:"P.5",name:"Cross-Border Data Transfer",desc:"Controls ensure personal data transferred outside Malaysia only to approved jurisdictions.",weight:2 },
      { id:"pdpa_6",code:"P.6",name:"Data Security Safeguards",desc:"Technical and organisational measures protect personal data against loss, misuse, and unauthorised access.",weight:3 },
      { id:"pdpa_7",code:"P.7",name:"Data Protection Officer",desc:"Designated DPO or equivalent responsible for PDPA compliance and staff training.",weight:2 },
    ]},
  { id:"sc-gtrm", name:"SC GTRM", full:"SC Guidelines on Technology Risk Management", flag:"🇲🇾", icon:"📈", color:"#7C3AED", regulator:"Securities Commission Malaysia",
    desc:"Securities Commission guidelines for technology risk management in capital markets.",
    requirements:[
      { id:"gtrm_1",code:"G.1",name:"Technology Risk Governance",desc:"Board-approved Technology Risk Management policy; named accountable executive.",weight:3 },
      { id:"gtrm_2",code:"G.2",name:"Technology Risk Assessment",desc:"Regular technology risk assessments with documented risk register and treatment plans.",weight:3 },
      { id:"gtrm_3",code:"G.3",name:"System Resilience & Recovery",desc:"Documented and tested RTO/RPO; annual recovery test results reviewed by Board.",weight:3 },
      { id:"gtrm_4",code:"G.4",name:"Cyber Threat Management",desc:"Threat intelligence programme; documented and exercised cyber incident response plan.",weight:3 },
      { id:"gtrm_5",code:"G.5",name:"Third Party Technology Risk",desc:"Technology risk assessments on all critical technology service providers.",weight:2 },
      { id:"gtrm_6",code:"G.6",name:"Change Management",desc:"Formal change management process for all technology changes with impact assessment.",weight:2 },
      { id:"gtrm_7",code:"G.7",name:"Technology Audit",desc:"Annual independent technology audit by qualified internal or external auditor.",weight:2 },
    ]},
  { id:"nacsa-cop", name:"NACSA COP", full:"NACSA Code of Practice for CNII", flag:"🇲🇾", icon:"🏛️", color:"#059669", regulator:"NACSA",
    desc:"National Cyber Security Agency standards for Critical National Information Infrastructure operators.",
    requirements:[
      { id:"cop_1",code:"C.1",name:"CNII Asset Identification",desc:"All CNII assets identified, classified, and registered in an authoritative asset register.",weight:3 },
      { id:"cop_2",code:"C.2",name:"Cyber Risk Assessment",desc:"Annual cyber risk assessment conducted for all CNII assets using approved methodology.",weight:3 },
      { id:"cop_3",code:"C.3",name:"Security Baseline Compliance",desc:"Minimum security baseline applied, enforced, and audited across all CNII systems.",weight:3 },
      { id:"cop_4",code:"C.4",name:"Incident Reporting to MyCERT",desc:"Cyber incidents reported to MyCERT/NACSA within required timeframes (Sev1: 1hr, Sev2: 4hr).",weight:3 },
      { id:"cop_5",code:"C.5",name:"Supply Chain Security",desc:"Security requirements embedded in all supply chain contracts; TPRM assessments completed.",weight:2 },
      { id:"cop_6",code:"C.6",name:"Cyber Exercise Participation",desc:"Annual participation in NACSA-led or sector cyber exercises; lessons learned integrated.",weight:2 },
      { id:"cop_7",code:"C.7",name:"Penetration Testing",desc:"Annual penetration testing of all critical CNII systems by approved service provider.",weight:2 },
    ]},
  { id:"bnm-rmit", name:"BNM RMiT", full:"Bank Negara Malaysia Risk Management in Technology", flag:"🇲🇾", icon:"🏦", color:"#DC2626", regulator:"Bank Negara Malaysia",
    desc:"BNM's policy document for technology and cyber risk management in financial institutions.",
    requirements:[
      { id:"rmit_1",code:"R.1",name:"Technology Risk Appetite",desc:"Board-approved technology risk appetite with defined thresholds, KRIs, and escalation triggers.",weight:3 },
      { id:"rmit_2",code:"R.2",name:"Technology Governance",desc:"Technology Risk Management function with clear reporting lines to Board and senior management.",weight:3 },
      { id:"rmit_3",code:"R.3",name:"Cloud Risk Management",desc:"Cloud risk assessment framework; Board-approved cloud strategy with risk assessment for each deployment.",weight:3 },
      { id:"rmit_4",code:"R.4",name:"Cyber Risk Management",desc:"Cyber risk programme aligned to BNM RMiT requirements; cyber risk reported to Board.",weight:3 },
      { id:"rmit_5",code:"R.5",name:"Operational Resilience",desc:"Technology recovery capabilities tested annually; RTO/RPO achieved for all Tier 1 systems.",weight:3 },
      { id:"rmit_6",code:"R.6",name:"Technology Audit",desc:"Annual independent technology audit; findings tracked and remediated within agreed timelines.",weight:2 },
      { id:"rmit_7",code:"R.7",name:"Technology Service Provider",desc:"TSP risk assessments; concentration risk assessed; exit plans documented for critical TSPs.",weight:2 },
    ]},
];

// ── DYNAMIC CONTROL INSIGHTS (per score band) ─────────────────────
const CONTROL_INSIGHTS = {
  CY1_1:{
    band1:{quick:"Draft a one-page Cybersecurity Policy this week and identify a Board sponsor to own it.",long:"Develop a full policy suite, secure Board approval, and establish an annual review cycle aligned to ISO 27001."},
    band2:{quick:"Submit your draft policy for formal Board approval — target sign-off within 30 days.",long:"Implement a policy compliance tracking programme with dashboard reporting to leadership on adherence rates."},
    band3:{quick:"Add automated quarterly policy compliance reporting for the Board with distribution triggers.",long:"Deploy a GRC platform to automate policy management, versioning, and compliance evidence collection."},
    band4:{quick:"Benchmark your policy framework against ISO 27001:2022 and NIST CSF 2.0 — close any gaps.",long:"Implement AI-assisted policy monitoring with real-time compliance scoring and proactive exception alerting."},
  },
  CY1_2:{
    band1:{quick:"Add 'Cyber Risk' as a standing agenda item at the next Board or ExCo meeting immediately.",long:"Establish a formal Board Cyber Risk mandate; appoint a named Cyber Accountable Officer at C-suite level."},
    band2:{quick:"Document Board cyber responsibilities in Terms of Reference — circulate for formal sign-off.",long:"Develop a Board cyber capability programme: quarterly briefings, tabletop exercises, and a structured reporting framework."},
    band3:{quick:"Present a Board cyber scorecard at the next meeting showing top 5 risk indicators with trends.",long:"Establish a Board Cyber Committee with independent expert advisors and formal risk appetite statements."},
    band4:{quick:"Commission an independent external review of Board cyber governance effectiveness.",long:"Benchmark Board oversight against CISA CTEM and integrate cyber into enterprise risk appetite and strategy."},
  },
  CY1_3:{
    band1:{quick:"Document a simple RACI covering your top 5 cybersecurity roles — it's a strong start.",long:"Develop a comprehensive Security Roles & Responsibilities framework covering all departments and third parties."},
    band2:{quick:"Publish your RACI to all staff and confirm accountability sign-off from each function head.",long:"Integrate security roles into job descriptions, performance reviews, and employee onboarding processes."},
    band3:{quick:"Review your RACI quarterly and update for any new systems, projects, or org changes.",long:"Implement a skills framework for each security role with training requirements and competency assessments."},
    band4:{quick:"Automate RACI review triggers linked to HR change events such as new hires, role changes, and exits.",long:"Develop a Security Leadership Development Programme to build a sustainable internal talent pipeline."},
  },
  CY2_1:{
    band1:{quick:"Run a 2-hour risk identification workshop with department heads — capture your top 5 cyber risks.",long:"Implement a formal risk assessment process using ISO 27005 or NIST RMF methodology with defined cadence."},
    band2:{quick:"Formalise your risk register — assign owners, likelihood/impact ratings, and target review dates.",long:"Integrate risk assessment into project approval workflows and quarterly business reviews organisation-wide."},
    band3:{quick:"Run an automated vulnerability scan on all internet-facing assets and add results to your risk register.",long:"Deploy a GRC platform to automate risk scoring, owner notifications, and treatment plan tracking."},
    band4:{quick:"Implement continuous risk scoring with automated alerts when risk levels breach defined thresholds.",long:"Adopt a Continuous Threat Exposure Management (CTEM) programme for real-time risk quantification and prioritisation."},
  },
  CY2_2:{
    band1:{quick:"Create a spreadsheet listing all systems with owner, data type, and sensitivity level — start small.",long:"Implement a formal Information Classification policy aligned to your regulatory and data sensitivity requirements."},
    band2:{quick:"Apply classification labels to your top 20 critical information assets this month.",long:"Deploy automated classification tooling (e.g., Microsoft Purview) and enforce via data loss prevention controls."},
    band3:{quick:"Spot-check 10% of classified assets monthly to validate classification accuracy and consistency.",long:"Integrate asset classification into your CMDB and enforce enforcement via DLP and access control policies."},
    band4:{quick:"Implement real-time classification drift detection — alert when data crosses classification boundaries.",long:"Deploy AI-powered data discovery and automated classification with continuous regulatory compliance monitoring."},
  },
  CY3_1:{
    band1:{quick:"Schedule a 30-minute cybersecurity awareness session for all staff within 2 weeks — even virtual.",long:"Build a formal annual Security Awareness Training programme with role-based modules and completion tracking."},
    band2:{quick:"Make awareness training mandatory and track completion rates — report to management monthly.",long:"Implement an e-learning platform with role-specific modules, knowledge tests, and annual recertification."},
    band3:{quick:"Introduce training effectiveness metrics: pre/post quiz scores and measured risk behaviour change.",long:"Deploy adaptive training that personalises content based on individual risk behaviour and phishing click history."},
    band4:{quick:"Add gamification elements — leaderboards, cyber badges, and completion incentives.",long:"Implement a behavioural risk scoring platform that continuously assesses and nudges individual cyber hygiene."},
  },
  CY3_2:{
    band1:{quick:"Run your first phishing simulation this month — free tools like GoPhish make this easy to start.",long:"Establish a quarterly phishing simulation programme with mandatory remedial training for those who click."},
    band2:{quick:"Analyse click rates by department and share results with leadership to drive team-level accountability.",long:"Implement advanced simulation scenarios — spear phishing, vishing, smishing — with trend reporting."},
    band3:{quick:"Add a 'Report Phishing' button to your email client and track the reporting rate as a security KPI.",long:"Integrate simulation data with your SIEM to correlate phishing-click risk with actual security incident patterns."},
    band4:{quick:"Run zero-day phishing simulations mimicking current threat actor tactics and techniques.",long:"Implement a continuous human risk management platform with real-time behavioural intervention at the point of risk."},
  },
  CY4_1:{
    band1:{quick:"List all suppliers with system or data access — even a simple spreadsheet is a meaningful start.",long:"Implement a formal Third Party Risk Management programme with tiered assessment methodology and risk register."},
    band2:{quick:"Send a security questionnaire to your top 10 critical vendors this quarter and track responses.",long:"Deploy a TPRM platform (e.g., SecurityScorecard, BitSight) for continuous automated supplier monitoring."},
    band3:{quick:"Schedule annual on-site or virtual security assessments for all Tier 1 critical vendors.",long:"Integrate TPRM into your procurement approval process — no critical supplier approved without security assessment."},
    band4:{quick:"Subscribe to real-time threat intelligence feeds tracking your key suppliers' security posture.",long:"Implement a fourth-party risk programme extending visibility to your suppliers' critical sub-suppliers."},
  },
  CY4_2:{
    band1:{quick:"Add a one-paragraph security clause to your standard supplier contract template today.",long:"Develop a comprehensive Supplier Security Addendum covering controls, incident reporting, and audit rights."},
    band2:{quick:"Audit your top 10 vendor contracts — ensure they include incident reporting and audit rights clauses.",long:"Implement a contract management system tracking security clause compliance across all supplier agreements."},
    band3:{quick:"Exercise your audit rights — conduct a formal security audit on at least one Tier 1 supplier annually.",long:"Develop tiered contract security requirements based on supplier risk classification and data access level."},
    band4:{quick:"Automate contract renewal triggers that fire when supplier risk scores deteriorate.",long:"Implement dynamic contract terms that automatically adjust obligations based on supplier security performance."},
  },
  CY5_1:{
    band1:{quick:"Document a basic 1-page BCP for your top 3 critical systems — who does what, and who to call.",long:"Develop a comprehensive BCP aligned to ISO 22301, covering all critical business functions and cyber scenarios."},
    band2:{quick:"Test your BCP with a tabletop exercise this quarter and formally document lessons learned.",long:"Extend your BCP to cover all cyber incident scenarios: ransomware, data breach, DDoS, and insider threat."},
    band3:{quick:"Conduct a live failover test for your most critical system and validate it meets your RTO/RPO targets.",long:"Integrate cyber incident response into your BCP with automated failover triggers and escalation workflows."},
    band4:{quick:"Run a full-scale multi-scenario BCDR exercise involving third parties and simulating regulatory engagement.",long:"Implement continuous BCP validation with automated recovery testing and real-time RTO performance monitoring."},
  },
  CY5_2:{
    band1:{quick:"Test a restoration from backup today — confirm it is actually recoverable before you need it.",long:"Implement a formal Backup & Recovery policy with defined RTO/RPO for all critical systems."},
    band2:{quick:"Schedule weekly automated backup tests and document restoration success rates for management review.",long:"Deploy immutable offsite backups using the 3-2-1 rule: 3 copies, 2 media types, 1 offsite location."},
    band3:{quick:"Implement monitoring that alerts you within 1 hour if any backup job fails or is incomplete.",long:"Engineer sub-4-hour RTO for all critical systems through automated restoration pipelines and runbooks."},
    band4:{quick:"Implement continuous data replication for Tier 1 systems with a sub-15-minute RPO target.",long:"Deploy fully automated Disaster Recovery as a Service (DRaaS) with zero-touch failover and auto-validation."},
  },
  CY6_1:{
    band1:{quick:"List all regulations applicable to your business: PDPA, BNM RMiT, SC GTRM, NACSA COP.",long:"Build a Compliance Programme with a regulatory register, gap analysis, and time-bound remediation roadmap."},
    band2:{quick:"Assign a named owner to each regulatory requirement and set formal review dates.",long:"Implement a unified compliance framework that maps all applicable regulations to your existing controls."},
    band3:{quick:"Automate compliance evidence collection for your top 3 most critical regulatory requirements.",long:"Deploy a GRC platform to automate regulatory tracking, evidence collection, and real-time gap reporting."},
    band4:{quick:"Implement predictive compliance monitoring that flags emerging regulatory changes before they take effect.",long:"Build a regulatory intelligence capability mapping new regulations to your control framework automatically."},
  },
  CY6_2:{
    band1:{quick:"Create a simple compliance checklist for your most critical regulation and review it monthly.",long:"Implement an evidence management system to continuously capture and maintain compliance proof per requirement."},
    band2:{quick:"Conduct a formal compliance review against your primary regulation this quarter.",long:"Build a compliance calendar with automated reminders for all evidence collection and submission deadlines."},
    band3:{quick:"Implement a compliance dashboard visible to leadership showing real-time status and trend.",long:"Automate evidence collection from your security tools feeding directly into your compliance platform."},
    band4:{quick:"Deploy AI-assisted compliance gap detection with automated remediation ticket creation and SLA tracking.",long:"Achieve continuous compliance monitoring with zero-day evidence availability for regulatory examinations."},
  },
  CY7_1:{
    band1:{quick:"Deploy antivirus/EDR on all managed devices this week — even free tools are better than nothing.",long:"Deploy enterprise EDR/XDR on all managed devices with centralised management and 24/7 alerting."},
    band2:{quick:"Enrol all endpoints into centralised MDM and enforce a documented baseline security configuration.",long:"Implement behavioural analytics on endpoints to detect anomalous activity beyond signature-based detection."},
    band3:{quick:"Enable automated quarantine for any endpoint that fails baseline security compliance checks.",long:"Deploy XDR integrating endpoint, network, and identity telemetry for correlated multi-vector threat detection."},
    band4:{quick:"Implement AI-driven proactive threat hunting across all endpoints on a minimum weekly basis.",long:"Deploy autonomous response capabilities isolating, investigating, and remediating threats without human delay."},
  },
  CY7_2:{
    band1:{quick:"Apply all critical and high patches that are over 30 days old this week — prioritise internet-facing systems.",long:"Implement a formal Patch Management programme with SLA-driven remediation timelines by patch severity."},
    band2:{quick:"Automate patch deployment for OS and common applications across all managed devices.",long:"Implement a vulnerability management programme with risk-based prioritisation (CVSS + asset criticality)."},
    band3:{quick:"Track patch compliance rate as a monthly management KPI — target 95%+ within SLA.",long:"Integrate vulnerability scanning with your patch management tool for automated SLA-driven remediation."},
    band4:{quick:"Implement zero-touch patching for critical vulnerabilities with a sub-24-hour deployment SLA.",long:"Deploy continuous vulnerability exposure scoring with AI-driven prioritisation and automated remediation workflows."},
  },
  CY8_1:{
    band1:{quick:"Enable MFA on all admin accounts and email today — Microsoft Authenticator or Google Authenticator.",long:"Implement a formal IAM programme with RBAC, MFA for all users, and quarterly access certification reviews."},
    band2:{quick:"Conduct an access review — remove all dormant accounts and enforce least-privilege for all users.",long:"Deploy PAM for all privileged accounts with session recording, vaulting, and just-in-time access provisioning."},
    band3:{quick:"Enforce MFA for all users (not only admins) and track MFA adoption rate as a security KPI.",long:"Implement Zero Trust identity with continuous authentication and risk-based adaptive access decisions."},
    band4:{quick:"Deploy passwordless authentication for all users using FIDO2/passkey standards.",long:"Implement AI-driven identity threat detection with real-time anomaly scoring and automated response actions."},
  },
  CY8_2:{
    band1:{quick:"Segment your most critical server environment from end-user devices immediately — this is quick to do.",long:"Develop a network segmentation strategy with defined security zones and formal inter-zone access controls."},
    band2:{quick:"Review and tighten all firewall rules — remove or justify every 'allow any' rule.",long:"Implement micro-segmentation between application tiers in your production environment."},
    band3:{quick:"Deploy network monitoring at zone boundaries and alert on any unusual inter-zone traffic patterns.",long:"Implement Software-Defined Networking (SDN) to enable dynamic, policy-driven network segmentation."},
    band4:{quick:"Implement Zero Trust Network Access (ZTNA) to replace legacy VPN for all remote access.",long:"Deploy full Zero Trust architecture with dynamic policy enforcement and continuous trust verification at every layer."},
  },
  CY9_1:{
    band1:{quick:"Enable centralised logging for Active Directory, firewalls, and key servers — free and impactful.",long:"Deploy a SIEM with defined use cases, alerting thresholds, and formal escalation procedures."},
    band2:{quick:"Define your top 10 SIEM use cases and configure automated alerting with documented response procedures.",long:"Integrate threat intelligence feeds into your SIEM to detect known threat actor tactics and techniques."},
    band3:{quick:"Tune your SIEM alerts to reduce false positives below 20% — review alert quality monthly.",long:"Deploy SOAR to automate response to your most common alert types, targeting 50% MTTR reduction."},
    band4:{quick:"Implement AI-driven behavioural detection to identify anomalies that rule-based systems miss.",long:"Build a 24/7 SOC with proactive threat hunting across all MITRE ATT&CK tactics and techniques."},
  },
  CY9_2:{
    band1:{quick:"Document a 1-page Incident Response Playbook for ransomware — who to call, what to isolate first.",long:"Develop a comprehensive Incident Response Plan covering ransomware, data breach, DDoS, and insider threat."},
    band2:{quick:"Conduct a tabletop exercise simulating a ransomware or data breach scenario this quarter.",long:"Test your IRP against all major scenario types annually and integrate all lessons learned into revisions."},
    band3:{quick:"Define MTTR targets for each incident severity level and track actual performance monthly.",long:"Implement automated incident response playbooks for Tier 1 incidents to eliminate manual delay."},
    band4:{quick:"Deploy threat-intelligence-driven threat hunting to identify adversaries before alerts fire.",long:"Implement a Cyber Fusion Centre integrating threat intelligence, SOC operations, and CIRT capabilities."},
  },
};

function getBand(score){
  if(score<2)return"band1"; if(score<3)return"band2"; if(score<4)return"band3"; return"band4";
}
function getBenchmark(country,industry,domainId){
  const base=COUNTRY_BASE[country]||2.5;
  const overall=Math.min(4.8,Math.max(1.0,base+(INDUSTRY_DELTA[industry]||0)));
  return Math.round(Math.min(4.8,Math.max(1.0,overall+((DOMAIN_DELTA[industry]||{})[domainId]||0)))*10)/10;
}
function fmtCur(usd,country){
  const c=COUNTRIES[country]||COUNTRIES.MY; const amt=usd*c.usdRate;
  if(c.currency==="IDR"){if(amt>=1e9)return`${c.symbol}${(amt/1e9).toFixed(1)}B`;if(amt>=1e6)return`${c.symbol}${(amt/1e6).toFixed(1)}M`;return`${c.symbol}${(amt/1e3).toFixed(0)}K`;}
  if(amt>=1e6)return`${c.symbol}${(amt/1e6).toFixed(1)}M`; if(amt>=1e3)return`${c.symbol}${(amt/1e3).toFixed(0)}K`; return`${c.symbol}${amt.toFixed(0)}`;
}

// ── CMA DATA ──────────────────────────────────────────────────────
const DOMAINS = [
  { id:"CY1",code:"CY.1",name:"Leadership & Governance",color:"#DC2626", controls:[
    { id:"CY1_1",name:"Cybersecurity Policy",question:"Does the organisation have a documented cybersecurity policy, owned at Board level?",
      levels:{1:"No formal policies in place.",2:"Policy exists but incomplete or not Board-approved.",3:"Policies are Board-approved, complete and regularly updated.",4:"Policies reviewed regularly; compliance actively measured and reported.",5:"Policies continuously reviewed; automated compliance monitoring in place."}, docs:"Cybersecurity policy, Board minutes" },
    { id:"CY1_2",name:"Board Accountability",question:"Does the Board take ownership and accountability for cyber security?",
      levels:{1:"No Board-level accountability.",2:"Board accountability exists but lacks authority or knowledge.",3:"Board individual has accountability and reports regularly.",4:"Board formally reviews cyber programme against objectives.",5:"Board has effective oversight ensuring cyber risks are managed per their direction."}, docs:"Board minutes with cyber agenda, CISO reporting pack" },
    { id:"CY1_3",name:"Roles & Responsibilities",question:"Does the organisation have clearly defined security roles across the whole organisation?",
      levels:{1:"Security roles not defined.",2:"Roles defined for IT only, not organisation-wide.",3:"Roles defined across the organisation including contractors.",4:"Roles reviewed periodically to remain fit for purpose.",5:"Roles continuously adapted to remain effective in changing environment."}, docs:"RACI charts, job descriptions" },
  ]},
  { id:"CY2",code:"CY.2",name:"Information Risk Management",color:"#EA580C", controls:[
    { id:"CY2_1",name:"Risk Assessment Process",question:"Does the organisation conduct formal cyber risk assessments regularly?",
      levels:{1:"No formal risk assessment process.",2:"Assessments conducted informally or ad hoc.",3:"Formal assessments at least annually using a recognised methodology.",4:"Risk assessments integrated into project lifecycle; reviewed quarterly.",5:"Continuous risk assessment with automated scanning and real-time scoring."}, docs:"Risk assessment reports, risk register" },
    { id:"CY2_2",name:"Asset Classification",question:"Does the organisation classify information assets by sensitivity and criticality?",
      levels:{1:"No classification scheme.",2:"Scheme exists but not consistently applied.",3:"Formal scheme applied to all major information assets.",4:"Classification reviewed regularly and enforced by technical controls.",5:"Automated classification with DLP integration and continuous monitoring."}, docs:"Classification policy, asset register" },
  ]},
  { id:"CY3",code:"CY.3",name:"Human Factors",color:"#CA8A04", controls:[
    { id:"CY3_1",name:"Security Awareness Training",question:"Does the organisation have a formal security awareness training programme for all staff?",
      levels:{1:"No awareness training.",2:"Ad hoc training delivered to some staff.",3:"Formal annual training mandatory for all staff.",4:"Role-based training with completion tracking and effectiveness measurement.",5:"Continuous adaptive training with personalised content and automated tracking."}, docs:"Training completion records, e-learning reports" },
    { id:"CY3_2",name:"Phishing Simulation",question:"Does the organisation conduct regular phishing simulations?",
      levels:{1:"No phishing simulations.",2:"Simulations conducted ad hoc with no follow-up training.",3:"Regular simulations (at least quarterly) with mandatory remedial training.",4:"Advanced simulations with trend analysis; results reported to management.",5:"Continuous simulation programme integrated with adaptive training and board reporting."}, docs:"Phishing simulation results, click-rate trends" },
  ]},
  { id:"CY4",code:"CY.4",name:"Third Parties",color:"#16A34A", controls:[
    { id:"CY4_1",name:"Third Party Risk Assessment",question:"Does the organisation conduct formal cyber security risk assessments on critical third parties?",
      levels:{1:"No third party risk assessment process.",2:"Assessments conducted informally for some suppliers.",3:"Formal assessments for all critical third parties at onboarding and annually.",4:"Continuous monitoring with risk scoring and escalation procedures.",5:"Real-time third party risk intelligence with automated alerts."}, docs:"Third party assessments, audit results" },
    { id:"CY4_2",name:"Supplier Contracts",question:"Do supplier contracts include appropriate cyber security requirements?",
      levels:{1:"No security requirements in supplier contracts.",2:"Some contracts include basic security clauses.",3:"All critical contracts include security, incident reporting, and audit rights clauses.",4:"Contracts include SLAs for security metrics; right to audit exercised regularly.",5:"Contracts dynamically updated based on threat intelligence."}, docs:"Contract templates, supplier agreements" },
  ]},
  { id:"CY5",code:"CY.5",name:"Resilience",color:"#0891B2", controls:[
    { id:"CY5_1",name:"Business Continuity Planning",question:"Does the organisation have documented and tested BCPs covering cyber incidents?",
      levels:{1:"No Business Continuity Plan.",2:"BCP exists but does not cover cyber or has not been tested.",3:"BCP documented, covers cyber, tested at least annually.",4:"BCP tested via tabletop and live failover; results tracked.",5:"Continuous BCP improvement with automated failover and real-time monitoring."}, docs:"BCP documents, test results" },
    { id:"CY5_2",name:"Backup & Recovery",question:"Does the organisation have a robust backup capability with tested restoration procedures?",
      levels:{1:"No formal backup procedures.",2:"Backups taken but restoration not regularly tested.",3:"Regular backups with documented restoration procedures tested quarterly.",4:"Immutable offsite backups with automated testing and defined RTO/RPO.",5:"Continuous data protection with automated failover and sub-hour RTO."}, docs:"Backup policy, restoration test results" },
  ]},
  { id:"CY6",code:"CY.6",name:"Compliance",color:"#7C3AED", controls:[
    { id:"CY6_1",name:"Compliance Programme",question:"Does the organisation have a formal programme to comply with applicable cyber security regulations?",
      levels:{1:"No compliance programme.",2:"Compliance managed reactively.",3:"Formal programme with regulatory register, owners, and annual review.",4:"Integrated with controls framework; gaps tracked and remediated.",5:"Automated compliance monitoring with real-time gap analysis."}, docs:"Regulatory register, compliance framework" },
    { id:"CY6_2",name:"Compliance Monitoring",question:"Does the organisation monitor and evidence compliance with regulations on an ongoing basis?",
      levels:{1:"No ongoing compliance monitoring.",2:"Compliance monitored manually and infrequently.",3:"Regular reviews with documented evidence and management sign-off.",4:"Automated evidence collection with compliance dashboards.",5:"Continuous monitoring with automated alerts for non-compliance."}, docs:"Compliance dashboards, evidence packs" },
  ]},
  { id:"CY7",code:"CY.7",name:"Technical Security",color:"#DB2777", controls:[
    { id:"CY7_1",name:"Endpoint Protection",question:"Does the organisation have effective endpoint protection deployed across all devices?",
      levels:{1:"No endpoint protection.",2:"Basic antivirus on some endpoints; no EDR.",3:"Antivirus/EDR on all managed endpoints with centralised management.",4:"EDR with behavioural analytics; endpoint compliance enforced via MDM.",5:"AI-driven XDR with automated response and full visibility."}, docs:"EDR deployment reports, endpoint compliance dashboard" },
    { id:"CY7_2",name:"Patch Management",question:"Does the organisation have a formal and effective patch management programme?",
      levels:{1:"No formal patch management.",2:"Patching performed reactively with no defined SLAs.",3:"Formal patch management; critical patches within 30 days.",4:"Automated patching; SLA compliance monitored and reported.",5:"Continuous automated patching with sub-24-hour critical patch SLAs."}, docs:"Patch management policy, vulnerability scan results" },
  ]},
  { id:"CY8",code:"CY.8",name:"Security Architecture",color:"#0284C7", controls:[
    { id:"CY8_1",name:"Identity & Access Management",question:"Does the organisation have a robust IAM capability including MFA?",
      levels:{1:"No formal IAM programme.",2:"Basic user provisioning; MFA not consistently enforced.",3:"Formal IAM with RBAC and MFA for all privileged users.",4:"PAM deployed; quarterly access reviews; MFA for all users.",5:"Zero Trust identity with continuous verification and just-in-time access."}, docs:"IAM policy, access review records, MFA adoption reports" },
    { id:"CY8_2",name:"Network Segmentation",question:"Does the organisation have effective network segmentation to limit attack spread?",
      levels:{1:"No network segmentation; flat network.",2:"Basic perimeter firewall; limited internal segmentation.",3:"Segmentation in place between key zones (production, corporate, DMZ).",4:"Micro-segmentation implemented; inter-zone traffic monitored.",5:"Full Zero Trust network architecture with dynamic policy enforcement."}, docs:"Network architecture diagrams, firewall rule sets" },
  ]},
  { id:"CY9",code:"CY.9",name:"Security Operations",color:"#059669", controls:[
    { id:"CY9_1",name:"Security Monitoring & SIEM",question:"Does the organisation have a SIEM capability with defined alerting?",
      levels:{1:"No centralised security monitoring.",2:"Basic log collection; no correlation or alerting.",3:"SIEM deployed with defined use cases, alerting, and escalation.",4:"SIEM with threat intelligence; alerts tuned; SLA-driven response.",5:"Advanced SIEM/SOAR with AI-driven detection and automated response."}, docs:"SIEM architecture, use case library, SOC SLA reports" },
    { id:"CY9_2",name:"Incident Response",question:"Does the organisation have a documented and tested Incident Response Plan?",
      levels:{1:"No Incident Response Plan.",2:"Basic IRP documented but not tested.",3:"Formal IRP documented and tested at least annually.",4:"IRP tested via tabletop and live exercises; lessons learned integrated.",5:"Continuous IR capability with automated playbooks and threat hunting."}, docs:"Incident Response Plan, tabletop exercise reports" },
  ]},
];

const SCENARIOS = [
  { id:"Ransomware",name:"Ransomware",icon:"🔒",color:"#DC2626",desc:"Ransomware attack encrypting critical systems", questions:[
    { code:"IMMUT_BACKUP",text:"% of critical systems with immutable, tested backups?",fair:"VULN",type:"pct",appetite:{green:80,amber:50} },
    { code:"EDR_COV",text:"% of endpoints with EDR/XDR deployed and active?",fair:"VULN",type:"pct",appetite:{green:90,amber:70} },
    { code:"PHISH_FAIL",text:"Latest phishing simulation failure rate (%)?",fair:"TEF",type:"pct",appetite:{green:10,amber:25,invert:true} },
    { code:"DOWN_COST_HR",text:"Estimated cost of downtime per hour (USD)?",fair:"LM",type:"usd" },
    { code:"MTTD_HRS",text:"Mean Time to Detect ransomware event (hours)?",fair:"LM",type:"hours" },
  ]},
  { id:"DataBreach",name:"Data Breach",icon:"💾",color:"#EA580C",desc:"Exfiltration of sensitive personal or business data", questions:[
    { code:"DATA_ENC_PCT",text:"% of sensitive data encrypted or tokenised at rest?",fair:"VULN",type:"pct",appetite:{green:90,amber:70} },
    { code:"DLP_BREADTH",text:"% of data egress channels covered by DLP controls?",fair:"VULN",type:"pct",appetite:{green:80,amber:60} },
    { code:"RECORDS_AT_RISK",text:"Personal data records in your largest system?",fair:"LM",type:"number" },
    { code:"COST_PER_REC",text:"Estimated cost per breached record (USD)?",fair:"LM",type:"usd" },
  ]},
  { id:"BEC",name:"Business Email Compromise",icon:"📧",color:"#16A34A",desc:"Fraudulent email attack leading to financial loss", questions:[
    { code:"MFA_COV",text:"% of email accounts with MFA enforced?",fair:"VULN",type:"pct",appetite:{green:95,amber:80} },
    { code:"DMARC",text:"DMARC configured in enforcement mode (%)?",fair:"VULN",type:"pct",appetite:{green:100,amber:50} },
    { code:"PAYMENT_DUAL",text:"% of payments requiring dual approval?",fair:"VULN",type:"pct",appetite:{green:100,amber:80} },
    { code:"AVG_FRAUD",text:"Average value of fraudulent transfer attempts (USD)?",fair:"LM",type:"usd" },
  ]},
  { id:"ThirdParty",name:"Third Party Risk",icon:"🔗",color:"#7C3AED",desc:"Cyber attack via a compromised supplier", questions:[
    { code:"TPRM_COV",text:"% of critical third parties risk-assessed in last 12 months?",fair:"VULN",type:"pct",appetite:{green:90,amber:60} },
    { code:"VENDOR_CONN_REVIEW",text:"% of vendor connections reviewed quarterly?",fair:"VULN",type:"pct",appetite:{green:90,amber:70} },
    { code:"VENDOR_BREACH_COST",text:"Estimated cost of a significant supply chain breach (USD)?",fair:"LM",type:"usd" },
  ]},
];

// ── SCORING ──────────────────────────────────────────────────────
function getCmmi(r){
  if(!r)return null; if(typeof r==="number")return r; return r.tod??r.cmmi??null;
}
function domainScore(domain,responses){
  const scores=domain.controls.map(c=>getCmmi(responses[c.id])).filter(s=>s!=null);
  return scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null;
}
function getRAG(q,val){
  if(val==null||val==="")return"grey"; const v=parseFloat(val); if(isNaN(v))return"grey";
  if(!q.appetite)return"grey"; const{green,amber,invert}=q.appetite;
  if(invert){if(v<=green)return"green";if(v<=amber)return"amber";return"red";}
  if(v>=green)return"green";if(v>=amber)return"amber";return"red";
}
function scoreScenario(sc,responses){
  const r=responses[sc.id]||{};
  const vq=sc.questions.filter(q=>q.fair==="VULN"); const tq=sc.questions.filter(q=>q.fair==="TEF"); const lq=sc.questions.filter(q=>q.fair==="LM");
  let vuln=50,tef=3,lm=0;
  if(vq.length){const vs=vq.map(q=>{const v=parseFloat(r[q.code]);if(isNaN(v))return null;return q.appetite?.invert?v:100-v;}).filter(v=>v!=null);if(vs.length)vuln=vs.reduce((a,b)=>a+b,0)/vs.length;}
  if(tq.length){const vs=tq.map(q=>parseFloat(r[q.code])).filter(v=>!isNaN(v));if(vs.length)tef=Math.max(0.5,vs.reduce((a,b)=>a+b,0)/vs.length/10);}
  lq.forEach(q=>{const v=parseFloat(r[q.code]);if(!isNaN(v)){if(q.type==="usd")lm+=v;else if(q.type==="hours")lm+=v*5000;else if(q.type==="number")lm+=v*165;}});
  const ale=tef*(vuln/100)*lm;
  return{vulnerability:Math.round(vuln),ale:Math.round(ale),p10:Math.round(ale*0.15),p50:Math.round(ale),p90:Math.round(ale*4.2)};
}
function simulateParse(fileName){
  const hash=fileName.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const tod=2+(hash%3);
  return{tod,confidence:tod>=3?"medium":"low",note:`Demo simulation for "${fileName}". Full AI-powered document analysis available in the hosted version.`};
}
function complianceScore(module,resp){
  const r=resp||{}; let met=0,partial=0,total=0;
  module.requirements.forEach(req=>{total+=req.weight;if(r[req.id]==="met")met+=req.weight;else if(r[req.id]==="partial")partial+=req.weight*0.5;});
  return total?Math.round(((met+partial)/total)*100):0;
}

// ── COMPONENTS ────────────────────────────────────────────────────
function Dot({color}){return <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:color,marginRight:6}}/>;}

function TodBtns({value,onChange}){
  const LBL={1:"Initial",2:"Developing",3:"Defined",4:"Managed",5:"Optimising"};
  return(
    <div>
      <div style={{color:"#9CA3AF",fontSize:11,marginBottom:4}}>Test of Design (ToD) — Does this control exist and is it well-designed?</div>
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={()=>onChange(n)} title={LBL[n]}
            style={{width:32,height:32,borderRadius:6,border:"none",cursor:"pointer",fontWeight:"bold",fontSize:12,
              background:value>=n?"#B91C1C":"#374151",color:value>=n?"white":"#9CA3AF",transition:"all .15s"}}>{n}</button>
        ))}
        {value&&<span style={{color:"#9CA3AF",fontSize:11,marginLeft:6}}>{LBL[value]}</span>}
      </div>
    </div>
  );
}

function FileZone({onParsed}){
  const [drag,setDrag]=useState(false); const [parsing,setParsing]=useState(false); const ref=useRef();
  const handle=useCallback(files=>{
    setParsing(true);
    setTimeout(()=>{Array.from(files).forEach(f=>onParsed(f,simulateParse(f.name)));setParsing(false);},1200);
  },[onParsed]);
  return(
    <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files);}} onClick={()=>ref.current?.click()}
      style={{border:`2px dashed ${drag?"#EF4444":"#4B5563"}`,borderRadius:8,padding:"12px",textAlign:"center",cursor:"pointer",background:drag?"rgba(220,38,38,.1)":"transparent",transition:"all .15s"}}>
      <input ref={ref} type="file" multiple accept=".pdf,.docx,.xlsx,.txt" style={{display:"none"}} onChange={e=>handle(e.target.files)}/>
      {parsing?<div style={{color:"#FCD34D",fontSize:12}}>⏳ AI analysing document…</div>
        :<><div style={{fontSize:20}}>📄</div><div style={{color:"#6B7280",fontSize:11}}>Drop evidence files for AI ToD auto-rating</div><div style={{color:"#4B5563",fontSize:10,marginTop:2}}>PDF · DOCX · XLSX · TXT</div></>}
    </div>
  );
}

function ControlCard({control,domain,resp,onTod,onFile}){
  const [open,setOpen]=useState(false);
  const tod=resp?.tod??null; const cmmi=getCmmi(resp);
  const docs=resp?.docs||[];
  const ragBg=cmmi==null?"#4B5563":cmmi>=4?"#16A34A":cmmi>=3?"#CA8A04":"#DC2626";
  const lvlLabel=cmmi==null?"Not Assessed":cmmi>=4.5?"Optimising":cmmi>=3.5?"Managed":cmmi>=2.5?"Defined":cmmi>=1.5?"Developing":"Initial";
  const ins=cmmi!=null?CONTROL_INSIGHTS[control.id]?.[getBand(cmmi)]:null;
  return(
    <div style={{background:"rgba(17,24,39,.7)",border:"1px solid #1F2937",borderRadius:10,marginBottom:8,overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Dot color={ragBg}/>
          <span style={{color:"white",fontSize:13,fontWeight:500}}>{control.name}</span>
          {docs.length>0&&<span style={{fontSize:10,background:"rgba(30,58,138,.5)",color:"#93C5FD",padding:"2px 6px",borderRadius:20}}>📄 {docs.length} doc{docs.length>1?"s":""}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {cmmi!=null&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:ragBg,color:"white"}}>ToD {cmmi.toFixed(1)} — {lvlLabel}</span>}
          <span style={{color:"#6B7280",fontSize:12}}>{open?"▲":"▼"}</span>
        </div>
      </button>
      {open&&(
        <div style={{padding:"0 14px 14px",borderTop:"1px solid #1F2937"}}>
          <p style={{color:"#D1D5DB",fontSize:12,fontStyle:"italic",margin:"10px 0"}}>{control.question}</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,marginBottom:12}}>
            {[1,2,3,4,5].map(lv=>(
              <div key={lv} style={{background:"#111827",borderRadius:6,padding:6}}>
                <div style={{color:"#EF4444",fontSize:10,fontWeight:"bold",marginBottom:2}}>Level {lv}</div>
                <div style={{color:"#6B7280",fontSize:9,lineHeight:1.3}}>{control.levels[lv]}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <div style={{color:"#D1D5DB",fontSize:11,fontWeight:600,marginBottom:6}}>📂 Upload Evidence for AI Rating</div>
              <FileZone onParsed={(f,r)=>onFile(control.id,f,r)}/>
              {docs.map((d,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(31,41,55,.6)",borderRadius:6,padding:"4px 8px",marginTop:4}}>
                  <span style={{color:"#D1D5DB",fontSize:10,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</span>
                  {d.tod&&<span style={{color:"#93C5FD",fontSize:10}}>ToD:{d.tod}</span>}
                  <span style={{fontSize:10,color:d.confidence==="high"?"#4ADE80":"#FCD34D"}}>{d.confidence==="high"?"✓":"~"}</span>
                </div>
              ))}
              {docs.length>0&&<div style={{color:"#6B7280",fontSize:9,marginTop:4}}>* AI rating inferred from keyword analysis. Full semantic AI available in hosted version.</div>}
            </div>
            <div>
              <div style={{color:"#D1D5DB",fontSize:11,fontWeight:600,marginBottom:6}}>📊 Manual Rating Override</div>
              <TodBtns value={tod} onChange={v=>onTod(control.id,v)}/>
              {cmmi!=null&&(
                <div style={{background:"#111827",borderRadius:8,padding:"8px 12px",marginTop:10}}>
                  <div style={{color:"#6B7280",fontSize:10}}>CMMI Score (= ToD)</div>
                  <div style={{color:"white",fontSize:22,fontWeight:"bold"}}>{cmmi.toFixed(1)}<span style={{color:"#6B7280",fontSize:12}}>/5</span></div>
                  <div style={{color:"#9CA3AF",fontSize:10}}>{lvlLabel}</div>
                </div>
              )}
            </div>
          </div>
          {ins&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div style={{background:"rgba(120,53,15,.2)",border:"1px solid rgba(217,119,6,.3)",borderRadius:6,padding:"8px"}}>
                <div style={{color:"#FCD34D",fontSize:10,fontWeight:600,marginBottom:4}}>⚡ Quick Win · Score {cmmi?.toFixed(1)}</div>
                <div style={{color:"#FDE68A",fontSize:11,lineHeight:1.5}}>{ins.quick}</div>
              </div>
              <div style={{background:"rgba(30,58,138,.2)",border:"1px solid rgba(37,99,235,.3)",borderRadius:6,padding:"8px"}}>
                <div style={{color:"#93C5FD",fontSize:10,fontWeight:600,marginBottom:4}}>📈 Long-term · Score {cmmi?.toFixed(1)}</div>
                <div style={{color:"#BFDBFE",fontSize:11,lineHeight:1.5}}>{ins.long}</div>
              </div>
            </div>
          )}
          <div style={{color:"#4B5563",fontSize:10,marginTop:8}}><b style={{color:"#6B7280"}}>Evidence to upload:</b> {control.docs}</div>
        </div>
      )}
    </div>
  );
}

// ── HOME SCREEN ───────────────────────────────────────────────────
function HomeScreen({onSelect}){
  return(
    <div style={{background:"linear-gradient(135deg,#1A0505 0%,#7F1D1D 50%,#1A0505 100%)",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{textAlign:"center",marginBottom:48}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:14,marginBottom:8}}>
          <div style={{width:56,height:56,background:"#991B1B",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🛡️</div>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:28,fontWeight:"bold",color:"white"}}>Cybernav Pro</div>
            <div style={{color:"#FCA5A5",fontSize:13}}>Cyber Maturity & Risk Quantification Platform</div>
          </div>
        </div>
        <p style={{color:"#9CA3AF",fontSize:13,margin:"12px 0 0"}}>Select an assessment category to get started</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,maxWidth:720,width:"100%"}}>
        {[
          { id:"governance", icon:"🏛️", title:"Governance", sub:"Cyber Maturity Assessment + FAIR Risk Quantification",
            desc:"Assess your organisation's cybersecurity maturity across 9 domains and quantify financial exposure using the FAIR methodology.",
            tags:["CMA Assessment","FAIR Risk Quantification","Benchmark Comparison","Improvement Roadmap"], accent:"#B91C1C" },
          { id:"compliance", icon:"📋", title:"Compliance", sub:"Regulatory Framework Readiness Assessment",
            desc:"Assess readiness against Malaysian regulatory frameworks. Upload your compliance toolkits to generate a detailed gap analysis.",
            tags:["PDPA","BNM RMiT","SC GTRM","NACSA COP"], accent:"#1D4ED8" },
        ].map(cat=>(
          <button key={cat.id} onClick={()=>onSelect(cat.id)}
            style={{background:"rgba(17,24,39,.85)",border:`2px solid #374151`,borderRadius:16,padding:"28px 24px",cursor:"pointer",textAlign:"left",transition:"all .2s"}}>
            <div style={{width:48,height:48,background:"rgba(153,27,27,.3)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,marginBottom:14}}>{cat.icon}</div>
            <div style={{color:"white",fontSize:18,fontWeight:"bold",marginBottom:4}}>{cat.title}</div>
            <div style={{color:"#FCA5A5",fontSize:11,marginBottom:12}}>{cat.sub}</div>
            <div style={{color:"#9CA3AF",fontSize:12,lineHeight:1.6,marginBottom:16}}>{cat.desc}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {cat.tags.map(t=><span key={t} style={{fontSize:10,padding:"3px 8px",borderRadius:20,background:"rgba(153,27,27,.3)",color:"#FCA5A5",border:"1px solid #991B1B"}}>{t}</span>)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── PROFILE SCREEN ────────────────────────────────────────────────
function ProfileScreen({category,onSubmit,onBack}){
  const [f,setF]=useState({country:"MY",orgName:"",industry:"Financial Services",orgSize:"sme",assessor:"",date:new Date().toISOString().split("T")[0]});
  const upd=(k,v)=>setF(p=>({...p,[k]:v}));
  const valid=f.orgName.trim()&&f.assessor.trim();
  const catLabel=category==="governance"?"Governance Assessment":"Compliance Assessment";
  return(
    <div style={{background:"linear-gradient(135deg,#1A0505 0%,#7F1D1D 50%,#1A0505 100%)",minHeight:"100vh",padding:"24px 16px"}}>
      <div style={{maxWidth:640,margin:"0 auto"}}>
        <button onClick={onBack} style={{color:"#FCA5A5",background:"none",border:"none",cursor:"pointer",fontSize:13,marginBottom:16}}>← Back to Home</button>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:12,marginBottom:8}}>
            <div style={{width:44,height:44,background:"#991B1B",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🛡️</div>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:20,fontWeight:"bold",color:"white"}}>Cybernav Pro</div>
              <div style={{color:"#FCA5A5",fontSize:12}}>{catLabel}</div>
            </div>
          </div>
          <p style={{color:"#9CA3AF",fontSize:13}}>Set up your organisation profile to begin</p>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{color:"#D1D5DB",fontSize:12,fontWeight:500,marginBottom:8}}>Select Country</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {Object.entries(COUNTRIES).map(([code,c])=>(
              <button key={code} onClick={()=>upd("country",code)}
                style={{padding:"12px 8px",borderRadius:10,border:`2px solid ${f.country===code?"#EF4444":"#374151"}`,background:f.country===code?"rgba(153,27,27,.3)":"rgba(31,41,55,.4)",cursor:"pointer",textAlign:"center"}}>
                <div style={{fontSize:26}}>{c.flag}</div>
                <div style={{color:"white",fontSize:11,fontWeight:500,marginTop:2}}>{c.name}</div>
                <div style={{color:"#9CA3AF",fontSize:10}}>{c.symbol}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{background:"rgba(17,24,39,.6)",border:"1px solid #374151",borderRadius:12,padding:"16px",marginBottom:16}}>
          <div style={{color:"white",fontSize:13,fontWeight:600,marginBottom:12}}>Organisation Details</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{gridColumn:"1/-1"}}>
              <div style={{color:"#9CA3AF",fontSize:11,marginBottom:4}}>Organisation Name *</div>
              <input value={f.orgName} onChange={e=>upd("orgName",e.target.value)} placeholder="e.g. Acme Financial Services Sdn Bhd"
                style={{width:"100%",background:"#1F2937",border:"1px solid #374151",borderRadius:8,padding:"8px 10px",color:"white",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <div style={{color:"#9CA3AF",fontSize:11,marginBottom:4}}>Industry</div>
              <select value={f.industry} onChange={e=>upd("industry",e.target.value)} style={{width:"100%",background:"#1F2937",border:"1px solid #374151",borderRadius:8,padding:"8px 10px",color:"white",fontSize:13,outline:"none"}}>
                {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <div style={{color:"#9CA3AF",fontSize:11,marginBottom:4}}>Assessor Name *</div>
              <input value={f.assessor} onChange={e=>upd("assessor",e.target.value)} placeholder="Your name"
                style={{width:"100%",background:"#1F2937",border:"1px solid #374151",borderRadius:8,padding:"8px 10px",color:"white",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
          </div>
        </div>
        <div style={{marginBottom:24}}>
          <div style={{color:"#D1D5DB",fontSize:12,fontWeight:500,marginBottom:8}}>Organisation Size</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {ORG_SIZES.map(s=>(
              <button key={s.id} onClick={()=>upd("orgSize",s.id)}
                style={{padding:"10px 6px",borderRadius:10,border:`2px solid ${f.orgSize===s.id?"#EF4444":"#374151"}`,background:f.orgSize===s.id?"rgba(153,27,27,.3)":"rgba(31,41,55,.4)",cursor:"pointer",textAlign:"center"}}>
                <div style={{fontSize:20}}>{s.icon}</div>
                <div style={{color:"white",fontSize:11,fontWeight:600,marginTop:2}}>{s.label}</div>
                <div style={{color:"#6B7280",fontSize:9,marginTop:1}}>{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <button onClick={()=>valid&&onSubmit(f)} disabled={!valid}
          style={{width:"100%",padding:"14px",borderRadius:12,border:"none",cursor:valid?"pointer":"not-allowed",fontWeight:600,fontSize:15,color:"white",background:valid?"#B91C1C":"#374151",opacity:valid?1:0.5}}>
          Start {catLabel} →
        </button>
      </div>
    </div>
  );
}

// ── CMA SCREEN ────────────────────────────────────────────────────
function CMAScreen({profile,cmaResp,setCmaResp,onNext,onBack}){
  const [active,setActive]=useState("CY1");
  const domain=DOMAINS.find(d=>d.id===active);
  const total=DOMAINS.reduce((a,d)=>a+d.controls.length,0);
  const done=Object.keys(cmaResp).filter(id=>getCmmi(cmaResp[id])!==null).length;
  const pct=Math.round((done/total)*100);
  const onTod=(cid,v)=>setCmaResp(p=>({...p,[cid]:{...(p[cid]||{}),tod:v,cmmi:v,docs:(p[cid]?.docs||[])}}));
  const onFile=(cid,file,rating)=>setCmaResp(p=>{
    const e=p[cid]||{docs:[]};
    const docs=[...(e.docs||[]),{name:file.name,...rating}];
    const best=Math.max(...docs.filter(d=>d.tod!=null).map(d=>d.tod||1),e.tod||0)||null;
    return{...p,[cid]:{...e,docs,tod:best||e.tod,cmmi:best||e.tod}};
  });
  return(
    <div style={{background:"#0D0505",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <div style={{background:"linear-gradient(90deg,#7F1D1D,#991B1B)",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{color:"#FCA5A5",background:"none",border:"none",cursor:"pointer",fontSize:13}}>← Back</button>
          <div>
            <div style={{color:"white",fontWeight:"bold",fontSize:14}}>Cyber Maturity Assessment</div>
            <div style={{color:"#FCA5A5",fontSize:11}}>{profile.orgName} · {COUNTRIES[profile.country]?.flag} {profile.industry}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{textAlign:"right"}}>
            <div style={{color:"white",fontSize:12}}>{done}/{total} assessed</div>
            <div style={{height:4,width:100,background:"#374151",borderRadius:4,marginTop:3}}>
              <div style={{height:4,background:"#EF4444",borderRadius:4,width:`${pct}%`,transition:"width .3s"}}/>
            </div>
          </div>
          <button onClick={onNext} style={{background:"#991B1B",color:"white",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>
            Next: Risk Quantification →
          </button>
        </div>
      </div>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div style={{width:182,borderRight:"1px solid #1F2937",padding:"12px 10px",overflowY:"auto"}}>
          {DOMAINS.map(d=>{
            const sc=domainScore(d,cmaResp); const done2=d.controls.filter(c=>getCmmi(cmaResp[c.id])!=null).length;
            return(
              <button key={d.id} onClick={()=>setActive(d.id)}
                style={{width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:8,border:`1px solid ${active===d.id?"#B91C1C":"transparent"}`,background:active===d.id?"rgba(153,27,27,.3)":"transparent",cursor:"pointer",marginBottom:3}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{color:"white",fontSize:11,fontWeight:500}}>{d.code}</span>
                  <span style={{color:sc?"white":"#4B5563",fontSize:11}}>{sc?sc.toFixed(1):"—"}</span>
                </div>
                <div style={{color:"#6B7280",fontSize:10,marginTop:1,lineHeight:1.2}}>{d.name}</div>
                <div style={{height:2,background:"#1F2937",borderRadius:2,marginTop:4}}>
                  <div style={{height:2,borderRadius:2,width:`${(done2/d.controls.length)*100}%`,background:d.color}}/>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{flex:1,padding:"20px",overflowY:"auto"}}>
          <h2 style={{color:"white",fontSize:16,fontWeight:"bold",margin:"0 0 4px"}}>{domain.code} — {domain.name}</h2>
          <p style={{color:"#6B7280",fontSize:11,marginBottom:16}}>Upload evidence documents for AI-based ToD auto-rating, or manually set the rating below. CMMI score = Test of Design (ToD) rating.</p>
          {domain.controls.map(c=>(
            <ControlCard key={c.id} control={c} domain={domain} resp={cmaResp[c.id]} onTod={onTod} onFile={onFile}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CRQ SCREEN ────────────────────────────────────────────────────
function CRQScreen({profile,crqResp,setCrqResp,onNext,onBack}){
  const [active,setActive]=useState("Ransomware");
  const sc=SCENARIOS.find(s=>s.id===active);
  const cur=COUNTRIES[profile?.country]||COUNTRIES.MY;
  const upd=(code,val)=>setCrqResp(p=>({...p,[active]:{...(p[active]||{}),[code]:val}}));
  return(
    <div style={{background:"#0D0505",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <div style={{background:"linear-gradient(90deg,#7F1D1D,#991B1B)",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{color:"#FCA5A5",background:"none",border:"none",cursor:"pointer",fontSize:13}}>← Back</button>
          <div>
            <div style={{color:"white",fontWeight:"bold",fontSize:14}}>FAIR Risk Quantification</div>
            <div style={{color:"#FCA5A5",fontSize:11}}>Values in {cur.currency} ({cur.symbol}) · {cur.name}</div>
          </div>
        </div>
        <button onClick={onNext} style={{background:"#991B1B",color:"white",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>View Dashboard →</button>
      </div>
      <div style={{display:"flex",flex:1}}>
        <div style={{width:170,borderRight:"1px solid #1F2937",padding:"10px 8px"}}>
          {SCENARIOS.map(s=>(
            <button key={s.id} onClick={()=>setActive(s.id)}
              style={{width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:8,border:`1px solid ${active===s.id?"#B91C1C":"transparent"}`,background:active===s.id?"rgba(153,27,27,.3)":"transparent",cursor:"pointer",marginBottom:3,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:14}}>{s.icon}</span>
              <span style={{color:"white",fontSize:11,fontWeight:500}}>{s.name}</span>
            </button>
          ))}
        </div>
        <div style={{flex:1,padding:"20px",maxWidth:560}}>
          <div style={{fontSize:28,marginBottom:4}}>{sc.icon}</div>
          <h2 style={{color:"white",fontSize:18,fontWeight:"bold",margin:"0 0 4px"}}>{sc.name}</h2>
          <p style={{color:"#9CA3AF",fontSize:12,marginBottom:4}}>{sc.desc}</p>
          <p style={{color:"#6B7280",fontSize:11,marginBottom:20}}>1 USD = {cur.symbol}{cur.usdRate.toLocaleString()}</p>
          {sc.questions.map(q=>{
            const resp=crqResp[active]||{}; const rag=getRAG(q,resp[q.code]);
            const bc=rag==="green"?"#14532D":rag==="amber"?"#78350F":rag==="red"?"#7F1D1D":"#1F2937";
            return(
              <div key={q.code} style={{background:`${bc}80`,border:`1px solid ${rag==="green"?"#16A34A":rag==="amber"?"#D97706":rag==="red"?"#DC2626":"#374151"}`,borderRadius:10,padding:"12px",marginBottom:10}}>
                <span style={{fontSize:10,padding:"2px 6px",borderRadius:20,fontWeight:600,marginBottom:6,display:"inline-block",background:q.fair==="VULN"?"rgba(124,58,237,.3)":q.fair==="TEF"?"rgba(37,99,235,.3)":"rgba(234,88,12,.3)",color:q.fair==="VULN"?"#C4B5FD":q.fair==="TEF"?"#93C5FD":"#FDBA74"}}>{q.fair}</span>
                <div style={{color:"white",fontSize:13,marginBottom:8}}>{q.text}</div>
                {q.type==="pct"?(
                  <div>
                    <input type="range" min={0} max={100} value={resp[q.code]||0} onChange={e=>upd(q.code,e.target.value)} style={{width:"100%"}}/>
                    <div style={{display:"flex",justifyContent:"space-between",color:"#9CA3AF",fontSize:11,marginTop:2}}>
                      <span>0%</span><span style={{color:"white",fontWeight:600}}>{resp[q.code]||0}%</span><span>100%</span>
                    </div>
                  </div>
                ):(
                  <input type="number" value={resp[q.code]||""} onChange={e=>upd(q.code,e.target.value)} placeholder={q.type==="usd"?`Amount in ${cur.currency}`:"Enter value"}
                    style={{width:"100%",background:"rgba(17,24,39,.8)",border:"1px solid #374151",borderRadius:8,padding:"8px 10px",color:"white",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function Dashboard({profile,cmaResp,crqResp,onRoadmap,onBack}){
  const country=profile?.country||"MY"; const cur=COUNTRIES[country];
  const radarData=DOMAINS.map(d=>({subject:d.code,score:Math.round((domainScore(d,cmaResp)||0)*10)/10,benchmark:getBenchmark(country,profile.industry,d.id),fullMark:5}));
  const overall=(()=>{const ss=DOMAINS.map(d=>domainScore(d,cmaResp)).filter(s=>s!=null);return ss.length?ss.reduce((a,b)=>a+b)/ss.length:null;})();
  const bench=getBenchmark(country,profile.industry,"CY1");
  const scScores=SCENARIOS.map(s=>{const sc=scoreScenario(s,crqResp);return{name:s.name,...sc};}).filter(s=>s.ale>0);
  const totalAle=scScores.reduce((a,s)=>a+s.ale,0);
  const lvl=s=>s>=4.5?"Optimising":s>=3.5?"Managed":s>=2.5?"Defined":s>=1.5?"Developing":"Initial";
  const src=country==="SG"?"Palo Alto APAC 2025 + NCSI 2023":"Cisco CRI 2024";
  return(
    <div style={{background:"#0D0505",minHeight:"100vh"}}>
      <div style={{background:"linear-gradient(90deg,#7F1D1D,#991B1B)",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{color:"#FCA5A5",background:"none",border:"none",cursor:"pointer",fontSize:13}}>← Back</button>
          <div>
            <div style={{color:"white",fontWeight:"bold",fontSize:14}}>Assessment Dashboard</div>
            <div style={{color:"#FCA5A5",fontSize:11}}>{profile.orgName} · {cur?.flag} {profile.industry} · {cur?.name}</div>
          </div>
        </div>
        <button onClick={onRoadmap} style={{background:"rgba(31,41,55,.8)",color:"white",border:"1px solid #374151",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12}}>🗺️ View Roadmap</button>
      </div>
      <div style={{padding:"20px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          {[
            {label:"Overall CMMI Score",val:overall?`${overall.toFixed(1)}/5.0`:"—",sub:overall?lvl(overall):"Complete CMA",color:"#F87171"},
            {label:`${profile.industry} Benchmark`,val:bench.toFixed(1),sub:`${cur?.name} peers · ${lvl(bench)}`,color:"#FCD34D"},
            {label:"vs Industry Peers",val:overall?`${overall-bench>=0?"+":""}${(overall-bench).toFixed(1)}`:"—",sub:overall&&overall>=bench?"Above benchmark":"Below benchmark",color:overall&&overall>=bench?"#4ADE80":"#F87171"},
            {label:"Portfolio ALE (P50)",val:totalAle?fmtCur(totalAle,country):"—",sub:totalAle?`P90: ${fmtCur(scScores.reduce((a,s)=>a+s.p90,0),country)}`:"Complete CRQ for ALE",color:"#FB923C"},
          ].map((k,i)=>(
            <div key={i} style={{background:"rgba(17,24,39,.7)",border:"1px solid #1F2937",borderRadius:10,padding:"14px"}}>
              <div style={{color:"#9CA3AF",fontSize:11,marginBottom:4}}>{k.label}</div>
              <div style={{fontSize:22,fontWeight:"bold",color:k.color}}>{k.val}</div>
              <div style={{color:"#6B7280",fontSize:10,marginTop:2}}>{k.sub}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div style={{background:"rgba(17,24,39,.7)",border:"1px solid #1F2937",borderRadius:10,padding:"16px"}}>
            <div style={{color:"white",fontSize:13,fontWeight:600,marginBottom:4}}>Cyber Maturity by Domain</div>
            <div style={{color:"#6B7280",fontSize:10,marginBottom:8}}>🔴 Your score &nbsp;|&nbsp; 🟡 {profile.industry} peers ({cur?.name})</div>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151"/>
                <PolarAngleAxis dataKey="subject" tick={{fill:"#9CA3AF",fontSize:10}}/>
                <PolarRadiusAxis domain={[0,5]} tick={{fill:"#6B7280",fontSize:8}}/>
                <Radar name="Your Score" dataKey="score" stroke="#DC2626" fill="#DC2626" fillOpacity={0.25} strokeWidth={2}/>
                <Radar name="Benchmark" dataKey="benchmark" stroke="#F59E0B" fill="none" strokeDasharray="5 5" strokeWidth={2}/>
                <Tooltip formatter={(v,n)=>[v.toFixed(1),n]} contentStyle={{background:"#1F2937",border:"1px solid #374151",borderRadius:8,fontSize:11}}/>
              </RadarChart>
            </ResponsiveContainer>
            <div style={{color:"#4B5563",fontSize:9,textAlign:"center",marginTop:4}}>Source: {src}</div>
          </div>
          <div style={{background:"rgba(17,24,39,.7)",border:"1px solid #1F2937",borderRadius:10,padding:"16px"}}>
            <div style={{color:"white",fontSize:13,fontWeight:600,marginBottom:12}}>Domain Scores vs Peers</div>
            {radarData.map(d=>{
              const diff=d.score-d.benchmark;
              return(
                <div key={d.subject} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{color:"#9CA3AF",fontSize:10,width:30}}>{d.subject}</span>
                  <div style={{flex:1,height:18,background:"#111827",borderRadius:20,position:"relative",overflow:"visible"}}>
                    <div style={{height:18,background:"rgba(185,28,28,.6)",borderRadius:20,width:`${(d.score/5)*100}%`}}/>
                    <div style={{position:"absolute",top:0,height:18,width:2,background:"#F59E0B",left:`${(d.benchmark/5)*100}%`}}/>
                  </div>
                  <span style={{color:"white",fontSize:10,width:24,textAlign:"right"}}>{d.score||"—"}</span>
                  <span style={{fontSize:10,width:28,textAlign:"right",color:d.score>0?(diff>=0?"#4ADE80":"#F87171"):"#6B7280"}}>{d.score>0?`${diff>=0?"+":""}${diff.toFixed(1)}`:"—"}</span>
                </div>
              );
            })}
            <div style={{color:"#4B5563",fontSize:9,marginTop:8}}>Red bar = your score · Yellow line = peer benchmark</div>
          </div>
        </div>
        {scScores.length>0&&(
          <div style={{background:"rgba(17,24,39,.7)",border:"1px solid #1F2937",borderRadius:10,padding:"16px"}}>
            <div style={{color:"white",fontSize:13,fontWeight:600,marginBottom:4}}>FAIR Risk — Annual Loss Expectancy ({cur?.currency})</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={scScores} layout="vertical" margin={{left:10,right:60}}>
                <CartesianGrid horizontal={false} stroke="#374151"/>
                <XAxis type="number" tickFormatter={v=>fmtCur(v,country)} tick={{fill:"#9CA3AF",fontSize:9}}/>
                <YAxis type="category" dataKey="name" tick={{fill:"#D1D5DB",fontSize:10}} width={130}/>
                <Tooltip formatter={(v,n)=>[fmtCur(v,country),n]} contentStyle={{background:"#1F2937",border:"1px solid #374151",borderRadius:8,fontSize:11}}/>
                <Bar dataKey="p10" name="P10" stackId="a" fill="#1E3A5F"/>
                <Bar dataKey="p50" name="P50" stackId="a" fill="#DC2626"/>
                <Bar dataKey="p90" name="P90" stackId="a" fill="#7F1D1D" radius={[0,4,4,0]}/>
                <Legend/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ROADMAP SCREEN ────────────────────────────────────────────────
function RoadmapScreen({profile,cmaResp,onBack}){
  const [filter,setFilter]=useState("all");
  const items=DOMAINS.flatMap(d=>d.controls.map(c=>{
    const r=cmaResp[c.id]; const cmmi=getCmmi(r); if(cmmi==null)return null;
    const band=getBand(cmmi); const ins=CONTROL_INSIGHTS[c.id]?.[band];
    return{domainCode:d.code,domainName:d.name,domainColor:d.color,controlId:c.id,controlName:c.name,
      cmmi:Math.round(cmmi*10)/10,tod:r?.tod,priority:cmmi<2?"immediate":cmmi<3?"shortterm":"longterm",
      quick:ins?.quick||"Review and improve control documentation and evidence.",
      long:ins?.long||"Develop a strategic improvement plan aligned to industry best practice.",
      band,target:Math.min(5,Math.ceil(cmmi)+1)};
  }).filter(Boolean)).sort((a,b)=>a.cmmi-b.cmmi);
  const filtered=filter==="all"?items:items.filter(i=>i.priority===filter);
  const lvl=s=>s>=4.5?"Optimising":s>=3.5?"Managed":s>=2.5?"Defined":s>=1.5?"Developing":"Initial";
  const bandLabel={band1:"Level 1-2 · Initial/Developing",band2:"Level 2-3 · Developing/Defined",band3:"Level 3-4 · Defined/Managed",band4:"Level 4-5 · Managed/Optimising"};
  const groups={
    immediate:{label:"⚡ Immediate (0–30 days)",borderColor:"#DC2626",bg:"rgba(127,29,29,.15)"},
    shortterm:{label:"📅 Short-term (30–90 days)",borderColor:"#D97706",bg:"rgba(120,53,15,.15)"},
    longterm:{label:"🎯 Long-term (3–12 months)",borderColor:"#2563EB",bg:"rgba(30,58,138,.15)"},
  };
  return(
    <div style={{background:"#0D0505",minHeight:"100vh"}}>
      <div style={{background:"linear-gradient(90deg,#7F1D1D,#991B1B)",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{color:"#FCA5A5",background:"none",border:"none",cursor:"pointer",fontSize:13}}>← Dashboard</button>
          <div>
            <div style={{color:"white",fontWeight:"bold",fontSize:14}}>Improvement Roadmap</div>
            <div style={{color:"#FCA5A5",fontSize:11}}>{items.length} actions · {profile.orgName} · Recommendations tailored to your CMMI scores</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["all","All"],["immediate","Immediate"],["shortterm","Short-term"],["longterm","Long-term"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{padding:"6px 10px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:500,background:filter===v?"#991B1B":"rgba(31,41,55,.8)",color:filter===v?"white":"#9CA3AF"}}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"20px",maxWidth:920,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
          {[{p:"immediate",label:"Immediate",count:items.filter(i=>i.priority==="immediate").length,color:"#F87171",sub:"CMMI < 2.0"},
            {p:"shortterm",label:"Short-term",count:items.filter(i=>i.priority==="shortterm").length,color:"#FCD34D",sub:"CMMI 2.0–2.9"},
            {p:"longterm",label:"Long-term",count:items.filter(i=>i.priority==="longterm").length,color:"#93C5FD",sub:"CMMI 3.0+"}].map((s,i)=>(
            <div key={i} style={{background:"rgba(17,24,39,.7)",border:"1px solid #1F2937",borderRadius:10,padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:"bold",color:s.color}}>{s.count}</div>
              <div style={{color:"white",fontSize:12,fontWeight:500,marginTop:2}}>{s.label} Actions</div>
              <div style={{color:"#6B7280",fontSize:10,marginTop:2}}>{s.sub}</div>
            </div>
          ))}
        </div>
        {Object.entries(groups).map(([key,g])=>{
          const gi=filtered.filter(i=>i.priority===key); if(!gi.length)return null;
          return(
            <div key={key} style={{border:`1px solid ${g.borderColor}`,background:g.bg,borderRadius:10,marginBottom:16,overflow:"hidden"}}>
              <div style={{padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
                <span style={{color:"white",fontWeight:600,fontSize:13}}>{g.label}</span>
              </div>
              <div style={{padding:"12px"}}>
                {gi.map(item=>(
                  <div key={item.controlId} style={{background:"rgba(17,24,39,.7)",border:"1px solid #1F2937",borderRadius:8,padding:"12px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                          <span style={{fontSize:10,padding:"2px 6px",borderRadius:20,color:"white",fontWeight:500,background:item.domainColor+"88"}}>{item.domainCode}</span>
                          <span style={{color:"white",fontSize:13,fontWeight:500}}>{item.controlName}</span>
                        </div>
                        <div style={{color:"#9CA3AF",fontSize:11,marginBottom:4}}>{item.domainName}</div>
                        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:10}}>
                          {item.tod&&<span style={{fontSize:10,background:"rgba(30,58,138,.3)",color:"#93C5FD",padding:"2px 6px",borderRadius:20}}>ToD: {item.tod}/5</span>}
                          <span style={{color:"#6B7280",fontSize:10}}>{bandLabel[item.band]}</span>
                          <span style={{color:"#6B7280",fontSize:10}}>→ Target: {item.target}.0 ({lvl(item.target)})</span>
                        </div>
                        <div style={{background:"rgba(120,53,15,.2)",border:"1px solid rgba(217,119,6,.3)",borderRadius:6,padding:"8px",marginBottom:6}}>
                          <div style={{color:"#FCD34D",fontSize:10,fontWeight:600,marginBottom:2}}>⚡ Quick Win — tailored for CMMI {item.cmmi}</div>
                          <div style={{color:"#FDE68A",fontSize:11,lineHeight:1.5}}>{item.quick}</div>
                        </div>
                        <div style={{background:"rgba(30,58,138,.2)",border:"1px solid rgba(37,99,235,.3)",borderRadius:6,padding:"8px"}}>
                          <div style={{color:"#93C5FD",fontSize:10,fontWeight:600,marginBottom:2}}>📈 Long-term — tailored for CMMI {item.cmmi}</div>
                          <div style={{color:"#BFDBFE",fontSize:11,lineHeight:1.5}}>{item.long}</div>
                        </div>
                      </div>
                      <div style={{textAlign:"center",flexShrink:0}}>
                        <div style={{fontSize:22,fontWeight:"bold",color:"white"}}>{item.cmmi}</div>
                        <div style={{color:"#6B7280",fontSize:10}}>/5.0</div>
                        <div style={{color:"#9CA3AF",fontSize:10,marginTop:2}}>{lvl(item.cmmi)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {items.length===0&&(
          <div style={{textAlign:"center",padding:"60px 0",color:"#6B7280"}}>
            <div style={{fontSize:40,marginBottom:12}}>🗺️</div>
            <div style={{fontSize:15}}>No controls assessed yet.</div>
            <div style={{fontSize:12,marginTop:4}}>Complete the CMA assessment to generate your tailored roadmap.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── COMPLIANCE SELECT SCREEN ───────────────────────────────────────
function ComplianceSelectScreen({profile,onSelect,onBack}){
  return(
    <div style={{background:"#0D0505",minHeight:"100vh"}}>
      <div style={{background:"linear-gradient(90deg,#7F1D1D,#991B1B)",padding:"12px 20px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{color:"#FCA5A5",background:"none",border:"none",cursor:"pointer",fontSize:13}}>← Back</button>
        <div>
          <div style={{color:"white",fontWeight:"bold",fontSize:14}}>Compliance Assessment</div>
          <div style={{color:"#FCA5A5",fontSize:11}}>{profile.orgName} · {COUNTRIES[profile.country]?.flag} {profile.country}</div>
        </div>
      </div>
      <div style={{padding:"32px 24px",maxWidth:800,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{color:"white",fontSize:20,fontWeight:"bold",marginBottom:8}}>Select Regulatory Framework</div>
          <div style={{color:"#9CA3AF",fontSize:13}}>Choose a framework to assess. You can upload your compliance toolkit Excel file to load requirements from your own workbook.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {COMPLIANCE_MODULES.map(mod=>(
            <button key={mod.id} onClick={()=>onSelect(mod.id)}
              style={{background:"rgba(17,24,39,.8)",border:`2px solid ${mod.color}44`,borderRadius:14,padding:"22px 20px",cursor:"pointer",textAlign:"left",transition:"all .2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{width:42,height:42,background:mod.color+"33",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{mod.icon}</div>
                <div>
                  <div style={{color:"white",fontSize:16,fontWeight:"bold"}}>{mod.name}</div>
                  <div style={{color:mod.color,fontSize:10,marginTop:1}}>{mod.regulator}</div>
                </div>
              </div>
              <div style={{color:"#D1D5DB",fontSize:11,fontWeight:500,marginBottom:4}}>{mod.full}</div>
              <div style={{color:"#9CA3AF",fontSize:11,lineHeight:1.5,marginBottom:12}}>{mod.desc}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:10,color:"#6B7280"}}>{mod.requirements.length} requirements loaded</span>
                <span style={{fontSize:11,color:mod.color,fontWeight:500}}>Start Assessment →</span>
              </div>
            </button>
          ))}
        </div>
        <div style={{background:"rgba(17,24,39,.6)",border:"1px solid #374151",borderRadius:10,padding:"14px",marginTop:20,display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{fontSize:20}}>💡</div>
          <div>
            <div style={{color:"white",fontSize:12,fontWeight:600,marginBottom:4}}>Loading Your Compliance Toolkit</div>
            <div style={{color:"#9CA3AF",fontSize:11,lineHeight:1.6}}>After selecting a framework, you can upload your compliance toolkit Excel file to replace the default requirement set. The tool will parse the toolkit and load your organisation's specific requirements and control descriptions.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COMPLIANCE ASSESS SCREEN ──────────────────────────────────────
function ComplianceAssessScreen({profile,mod,compResp,setCompResp,onDashboard,onBack}){
  const module=COMPLIANCE_MODULES.find(m=>m.id===mod);
  const resp=compResp[mod]||{};
  const upd=(reqId,val)=>setCompResp(p=>({...p,[mod]:{...(p[mod]||{}),[reqId]:val}}));
  const done=module.requirements.filter(r=>resp[r.id]).length;
  const pct=Math.round((done/module.requirements.length)*100);
  const score=complianceScore(module,resp);
  const [toolkitLoaded,setToolkitLoaded]=useState(false);
  const [loading,setLoading]=useState(false);
  const tkRef=useRef();
  const handleToolkit=(files)=>{
    setLoading(true);
    setTimeout(()=>{setToolkitLoaded(true);setLoading(false);},1500);
  };
  const statusColors={"met":"#16A34A","partial":"#D97706","not_met":"#DC2626"};
  const statusLabels={"met":"✅ Met","partial":"⚠️ Partial","not_met":"❌ Not Met"};
  return(
    <div style={{background:"#0D0505",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <div style={{background:`linear-gradient(90deg,${module.color}cc,${module.color})`,padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{color:"rgba(255,255,255,.8)",background:"none",border:"none",cursor:"pointer",fontSize:13}}>← Back</button>
          <div>
            <div style={{color:"white",fontWeight:"bold",fontSize:14}}>{module.icon} {module.name} — {module.full}</div>
            <div style={{color:"rgba(255,255,255,.7)",fontSize:11}}>{profile.orgName} · {done}/{module.requirements.length} assessed · {pct}% complete</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{textAlign:"right"}}>
            <div style={{color:"white",fontSize:16,fontWeight:"bold"}}>{score}%</div>
            <div style={{color:"rgba(255,255,255,.7)",fontSize:10}}>Compliance Score</div>
          </div>
          <button onClick={onDashboard} style={{background:"rgba(0,0,0,.3)",color:"white",border:"1px solid rgba(255,255,255,.3)",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>View Report →</button>
        </div>
      </div>
      <div style={{display:"flex",flex:1}}>
        <div style={{width:220,borderRight:"1px solid #1F2937",padding:"12px 10px",overflowY:"auto"}}>
          <div style={{color:"#6B7280",fontSize:10,padding:"0 4px 8px",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Toolkit</div>
          <div onDragOver={e=>{e.preventDefault();}} onDrop={e=>{e.preventDefault();handleToolkit(e.dataTransfer.files);}}
            onClick={()=>tkRef.current?.click()}
            style={{border:`2px dashed ${toolkitLoaded?"#16A34A":"#4B5563"}`,borderRadius:8,padding:"10px",textAlign:"center",cursor:"pointer",marginBottom:12,background:toolkitLoaded?"rgba(22,163,74,.1)":"transparent"}}>
            <input ref={tkRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={e=>handleToolkit(e.target.files)}/>
            {loading?<div style={{color:"#FCD34D",fontSize:11}}>⏳ Loading toolkit…</div>
              :toolkitLoaded?<><div style={{fontSize:16}}>✅</div><div style={{color:"#4ADE80",fontSize:10}}>Toolkit loaded</div></>
              :<><div style={{fontSize:16}}>📊</div><div style={{color:"#6B7280",fontSize:10}}>Upload toolkit Excel</div></>}
          </div>
          <div style={{color:"#6B7280",fontSize:10,padding:"0 4px 8px",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Requirements</div>
          {module.requirements.map(req=>(
            <div key={req.id} style={{padding:"6px 8px",borderRadius:6,marginBottom:2,background:resp[req.id]?"rgba(31,41,55,.6)":"transparent"}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:resp[req.id]?statusColors[resp[req.id]]:"#4B5563",display:"inline-block",flexShrink:0}}/>
                <span style={{color:"white",fontSize:10,fontWeight:500}}>{req.code}</span>
                <span style={{color:"#9CA3AF",fontSize:10,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{req.name}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{flex:1,padding:"20px",overflowY:"auto"}}>
          <div style={{color:"#9CA3AF",fontSize:12,marginBottom:16}}>Rate each requirement based on your current state of compliance. Upload your toolkit to load organisation-specific requirements.</div>
          {module.requirements.map(req=>{
            const status=resp[req.id];
            const borderColor=status?statusColors[status]:"#374151";
            return(
              <div key={req.id} style={{background:"rgba(17,24,39,.7)",border:`1px solid ${borderColor}`,borderRadius:10,padding:"14px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:module.color+"33",color:module.color,fontWeight:600}}>{req.code}</span>
                      <span style={{color:"white",fontSize:13,fontWeight:500}}>{req.name}</span>
                      <span style={{fontSize:10,color:"#6B7280"}}>Weight: {req.weight}</span>
                    </div>
                    <div style={{color:"#9CA3AF",fontSize:12,lineHeight:1.5}}>{req.desc}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                    {[["met","✅ Met"],["partial","⚠️ Partial"],["not_met","❌ Not Met"]].map(([val,lbl])=>(
                      <button key={val} onClick={()=>upd(req.id,val)}
                        style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${status===val?statusColors[val]:"#374151"}`,background:status===val?statusColors[val]+"33":"transparent",color:status===val?statusColors[val]:"#9CA3AF",fontSize:11,cursor:"pointer",whiteSpace:"nowrap",fontWeight:status===val?600:400}}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── COMPLIANCE DASHBOARD ──────────────────────────────────────────
function ComplianceDashboardScreen({profile,mod,compResp,onBack,onAssess}){
  const module=COMPLIANCE_MODULES.find(m=>m.id===mod);
  const resp=compResp[mod]||{};
  const score=complianceScore(module,resp);
  const metCount=module.requirements.filter(r=>resp[r.id]==="met").length;
  const partialCount=module.requirements.filter(r=>resp[r.id]==="partial").length;
  const notMetCount=module.requirements.filter(r=>resp[r.id]==="not_met").length;
  const gaps=module.requirements.filter(r=>resp[r.id]==="not_met"||resp[r.id]==="partial").sort((a,b)=>b.weight-a.weight);
  const scoreColor=score>=80?"#16A34A":score>=60?"#D97706":"#DC2626";
  const scoreLabel=score>=80?"Strong compliance":score>=60?"Partial compliance — gaps identified":"Significant gaps — immediate action required";
  return(
    <div style={{background:"#0D0505",minHeight:"100vh"}}>
      <div style={{background:`linear-gradient(90deg,${module.color}cc,${module.color})`,padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{color:"rgba(255,255,255,.8)",background:"none",border:"none",cursor:"pointer",fontSize:13}}>← Back</button>
          <div>
            <div style={{color:"white",fontWeight:"bold",fontSize:14}}>{module.icon} {module.name} Compliance Report</div>
            <div style={{color:"rgba(255,255,255,.7)",fontSize:11}}>{profile.orgName} · {COUNTRIES[profile.country]?.flag} {profile.country}</div>
          </div>
        </div>
        <button onClick={onAssess} style={{background:"rgba(0,0,0,.3)",color:"white",border:"1px solid rgba(255,255,255,.3)",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12}}>← Edit Responses</button>
      </div>
      <div style={{padding:"24px",maxWidth:900,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:24}}>
          {[
            {label:"Compliance Score",val:`${score}%`,sub:scoreLabel,color:scoreColor},
            {label:"✅ Fully Met",val:metCount,sub:`of ${module.requirements.length} requirements`,color:"#4ADE80"},
            {label:"⚠️ Partially Met",val:partialCount,sub:"require improvement",color:"#FCD34D"},
            {label:"❌ Not Met",val:notMetCount,sub:"critical gaps to address",color:"#F87171"},
          ].map((k,i)=>(
            <div key={i} style={{background:"rgba(17,24,39,.7)",border:"1px solid #1F2937",borderRadius:10,padding:"14px"}}>
              <div style={{color:"#9CA3AF",fontSize:11,marginBottom:4}}>{k.label}</div>
              <div style={{fontSize:22,fontWeight:"bold",color:k.color}}>{k.val}</div>
              <div style={{color:"#6B7280",fontSize:10,marginTop:2}}>{k.sub}</div>
            </div>
          ))}
        </div>
        <div style={{background:"rgba(17,24,39,.7)",border:"1px solid #1F2937",borderRadius:10,padding:"16px",marginBottom:16}}>
          <div style={{color:"white",fontSize:13,fontWeight:600,marginBottom:12}}>Requirement Status Overview</div>
          {module.requirements.map(req=>{
            const status=resp[req.id];
            const bg=status==="met"?"#16A34A":status==="partial"?"#D97706":status==="not_met"?"#DC2626":"#374151";
            const pct=status==="met"?100:status==="partial"?50:0;
            return(
              <div key={req.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{color:"#9CA3AF",fontSize:10,width:28,flexShrink:0}}>{req.code}</span>
                <span style={{color:"#D1D5DB",fontSize:11,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{req.name}</span>
                <div style={{width:120,height:16,background:"#111827",borderRadius:20,overflow:"hidden",flexShrink:0}}>
                  <div style={{height:16,background:bg,width:`${pct}%`,borderRadius:20}}/>
                </div>
                <span style={{color:bg,fontSize:10,width:60,textAlign:"right",flexShrink:0}}>
                  {status==="met"?"✅ Met":status==="partial"?"⚠️ Partial":status==="not_met"?"❌ Gap":"— N/A"}
                </span>
              </div>
            );
          })}
        </div>
        {gaps.length>0&&(
          <div style={{background:"rgba(17,24,39,.7)",border:"1px solid #1F2937",borderRadius:10,padding:"16px"}}>
            <div style={{color:"white",fontSize:13,fontWeight:600,marginBottom:4}}>Gap Remediation Priorities</div>
            <div style={{color:"#6B7280",fontSize:11,marginBottom:12}}>Sorted by requirement weight (highest impact first)</div>
            {gaps.map(req=>{
              const status=resp[req.id];
              return(
                <div key={req.id} style={{background:"rgba(31,41,55,.6)",border:`1px solid ${status==="not_met"?"rgba(220,38,38,.4)":"rgba(217,119,6,.4)"}`,borderRadius:8,padding:"12px",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:10,padding:"2px 6px",borderRadius:20,background:module.color+"33",color:module.color,fontWeight:600}}>{req.code}</span>
                    <span style={{color:"white",fontSize:12,fontWeight:500}}>{req.name}</span>
                    <span style={{marginLeft:"auto",fontSize:10,color:status==="not_met"?"#F87171":"#FCD34D",fontWeight:600}}>{status==="not_met"?"❌ Not Met":"⚠️ Partial"}</span>
                  </div>
                  <div style={{color:"#9CA3AF",fontSize:11,lineHeight:1.5}}>{req.desc}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────
export default function App(){
  const [screen,setScreen]=useState("home");
  const [category,setCategory]=useState(null);
  const [profile,setProfile]=useState(null);
  const [cmaResp,setCmaResp]=useState({});
  const [crqResp,setCrqResp]=useState({});
  const [compModule,setCompModule]=useState(null);
  const [compResp,setCompResp]=useState({});

  if(screen==="home")          return <HomeScreen onSelect={cat=>{setCategory(cat);setScreen("profile");}}/>;
  if(screen==="profile")       return <ProfileScreen category={category} onSubmit={p=>{setProfile(p);setScreen(category==="governance"?"cma":"compliance-select");}} onBack={()=>setScreen("home")}/>;
  if(screen==="cma")           return <CMAScreen profile={profile} cmaResp={cmaResp} setCmaResp={setCmaResp} onNext={()=>setScreen("crq")} onBack={()=>setScreen("profile")}/>;
  if(screen==="crq")           return <CRQScreen profile={profile} crqResp={crqResp} setCrqResp={setCrqResp} onNext={()=>setScreen("dashboard")} onBack={()=>setScreen("cma")}/>;
  if(screen==="dashboard")     return <Dashboard profile={profile} cmaResp={cmaResp} crqResp={crqResp} onRoadmap={()=>setScreen("roadmap")} onBack={()=>setScreen("crq")}/>;
  if(screen==="roadmap")       return <RoadmapScreen profile={profile} cmaResp={cmaResp} onBack={()=>setScreen("dashboard")}/>;
  if(screen==="compliance-select") return <ComplianceSelectScreen profile={profile} onSelect={mod=>{setCompModule(mod);setScreen("compliance-assess");}} onBack={()=>setScreen("profile")}/>;
  if(screen==="compliance-assess") return <ComplianceAssessScreen profile={profile} mod={compModule} compResp={compResp} setCompResp={setCompResp} onDashboard={()=>setScreen("compliance-report")} onBack={()=>setScreen("compliance-select")}/>;
  if(screen==="compliance-report") return <ComplianceDashboardScreen profile={profile} mod={compModule} compResp={compResp} onBack={()=>setScreen("compliance-select")} onAssess={()=>setScreen("compliance-assess")}/>;
  return null;
}
