/**
 * @file config.js
 * @summary Centralizes all application constants, configuration data, and global state.
 * This makes the application easier to manage and update.
 */

// =================================================================================
// 1. CONSTANTS
// =================================================================================

export const CHARACTER_LIMIT = 995;
export const TWO_PART_SPLIT_THRESHOLD = 995;
export const TS_PROCESS_THREE_PART_THRESHOLD = 600;
export const RESOLUTION_COPY_CHAR_LIMIT = 999;
export const TS_CHAR_ORANGE_THRESHOLD = 875;
export const TS_CHAR_RED_THRESHOLD = 985;
export const AGENT_NAME_KEY = 'agentNameSaved';
export const APP_VERSION_KEY = 'appVersion';
export const SERVICES_TO_HIDE_PHYSICAL_CHECK = [
    'Telus Email', 'MyTelus', 'TOS', 'Telus Connect App', 'Living Well Companion', 'SHS ADT / Acquisition / Custom Home', 'Other', 'HomePhone / Copper'
];
export const SERVICES_TO_HIDE_AWA_SPEED = [
    'HomePhone / Fiber', 'HomePhone / Copper', 'Telus Email', 'MyTelus', 'TOS', 'Telus Connect App', 'Living Well Companion', 'Other'
];


// =================================================================================
// 2. GLOBAL STATE
// =================================================================================
// These are exported as 'let' so they can be modified by other modules.

export let state = {
    currentFinalNoteContent: '',
    lastNoteIdBeforeModalTransition: null,
    isEditingNoteFlag: false,
    currentViewedNoteId: null,
    currentEditingNoteId: null,
    currentlyViewedNoteData: null,
    historyNotesCache: [],
    highlightTimeout: null,
    resolveConfirmPromise: null,
    isAgentNameEditable: false,
    awaitingChecklistCompletionForCopySave: false,
    // State for new multi-selects
    awaAlertsSelected: new Set(),
    extraStepsSelected: new Set(),
};


// =================================================================================
// 3. DATA CONFIGURATION
// =================================================================================

export const fieldConfig = {
    'agentName': { label: 'PFTS', required: true, type: 'text' },
    'ban': { label: 'BAN', required: true, type: 'text' },
    'cid': { label: 'CID', required: true, type: 'text' },
    'name': { label: 'NAME', required: true, type: 'text' },
    'cbr': { label: 'CBR', required: true, type: 'text' },
    'caller': { label: 'CALLER', required: true, type: 'select' },
    'verifiedBy': { label: 'VERIFIED BY', required: true, type: 'select' },
    'address': { label: 'ADDRESS', required: false, type: 'text' },
    'xid': { label: 'XID', required: true, type: 'text', conditional: true },
    'serviceOnCsr': { label: 'SERVICE ON CSR', required: true, type: 'select' },
    'outage': { label: 'Outage', required: true, type: 'radio' },
    'errorsInNC': { label: 'NetCracker', required: true, type: 'radio' },
    'accountSuspended': { label: 'Suspended', required: false, type: 'radio' },
    'skillToggle': { label: 'SKILL', required: true, type: 'checkbox' },
    'serviceSelect': { label: 'SERVICE', required: true, type: 'select' },
    'issueSelect': { label: 'WORKFLOW', required: true, type: 'select' },
    'cxIssueText': { label: 'CX ISSUE', required: true, type: 'textarea' },
    'affectedText': { label: 'AFFECTED', required: false, type: 'textarea', conditional: true },
    'physicalCheckList1Select': { label: 'ONT/GATEWAY', required: true, type: 'select' },
    'physicalCheckList2Select': { label: 'MODEM/GATEWAY', required: false, type: 'select', conditional: true },
    'physicalCheckList3Select': { label: 'BOOSTER/EXTENDER', required: false, type: 'select', conditional: true },
    'physicalCheckList4Select': { label: 'EXTRA BOOSTER', required: false, type: 'select', conditional: true },
    'enablePhysicalCheck2': { label: 'Enable Phys. 2', required: false, type: 'checkbox' },
    'enablePhysicalCheck3': { label: 'Enable Phys. 3', required: false, type: 'checkbox' },
    'enablePhysicalCheck4': { label: 'Enable Phys. 4', required: false, type: 'checkbox' },
    'xVuStatusSelect': { label: 'xVu STATUS', required: true, type: 'select', conditional: true },
    'packetLossSelect': { label: 'PACKET LOSS', required: true, type: 'select', conditional: true },
    'additionalinfoText': { label: 'ADDITIONAL INFO', required: false, type: 'textarea' },
    'troubleshootingProcessText': { label: 'TS STEPS', required: true, type: 'textarea' },
    'awaAlertsContainer': { label: 'AWA ALERTS', required: true, type: 'multiselect' },
    'awaStepsSelect': { label: 'AWA STEPS', required: false, type: 'select', conditional: true },
    'activeDevicesInput': { label: 'ACTIVE DEVICES', required: false, type: 'text' },
    'totalDevicesInput': { label: 'TOTAL DEVICES', required: false, type: 'text' },
    'downloadBeforeInput': { label: 'DL BEFORE', required: false, type: 'text' },
    'uploadBeforeInput': { label: 'UP BEFORE', required: false, type: 'text' },
    'downloadAfterInput': { label: 'DL AFTER', required: false, type: 'text' },
    'uploadAfterInput': { label: 'UP AFTER', required: false, type: 'text' },
    'tvsSelect': { label: 'TVS', required: true, type: 'select' },
    'tvsKeyInput': { label: 'TVS KEY', required: true, type: 'text', conditional: true },
    'extraStepsContainer': { label: 'EXTRA STEPS', required: false, type: 'multiselect' },
    'resolvedSelect': { label: 'RESOLVED', required: true, type: 'select' },
    'transferCheckbox': { label: 'Transfer Checkbox', required: false, type: 'checkbox' },
    'transferSelect': { label: 'TRANSFER', required: true, type: 'select', conditional: true },
    'cbr2Input': { label: 'CBR2', required: true, type: 'text', conditional: true },
    'aocInput': { label: 'AOC', required: false, type: 'text', conditional: true, readonly: true, defaultValue: 'Yes | $200 | Cx aware and agree' },
    'dispatchDateInput': { label: 'DISPATCH DATE', required: true, type: 'date', conditional: true },
    'dispatchTimeSlotSelect': { label: 'DISPATCH TIME', required: true, type: 'select', conditional: true },
    'csrOrderInput': { label: 'CSR ORDER', required: false, type: 'text' },
    'ticketInput': { label: 'TICKET', required: true, type: 'text' }
};

export const numericFields = [
    'ban', 'cid', 'cbr',
    'activeDevicesInput', 'totalDevicesInput',
    'downloadBeforeInput', 'uploadBeforeInput',
    'downloadAfterInput', 'uploadAfterInput',
    'ticketInput', 'csrOrderInput'
];

export const shsDeviceOptionsMap = {
    'InDoor Camera': ['ADC - V522', 'ADC - V523 / 523x'],
    'OutDoor Camera': ['ADC - V722w', 'ADC - V722 / 723x', 'ADC - V724'],
    'Doorbell Camera': ['SKYBELL/ADC - VDB105', 'ADC - VDB750', 'SKYBELL HD'],
    'DoorLock': ['Weiser 620', 'Weiser 10 TouchPad'],
    'Garage Door Controller': ['LiftMaster', 'GoControl'],
    'Main Panel': ['One Device Affected', 'Some Devices Affected', 'Multiple Devices Affected'],
    'Motion Sensor': ['Motion Sensor']
};
export const directIssueToDeviceMap = ['Smoke Detector', 'CO Detector', 'Glass Break Detector', 'Thermostat'];
export const shsIssuesToDisableDevice = [
    'Login / Password Issues', 'WebPage Portal Issues', 'APP Issues',
    'CMS inquiry', 'Smart Automation Devices', 'Wi-Fi Issues', 'Secondary Panel'
];

export const equipmentOptions = {
    'HighSpeed / Fiber': {
        list1: ['N/A', 'G-240G w/RED Fail light ON', 'G-240G w/CAT6 on DATA1', 'G-240G without lights/No Power', 'I-240G w/RED Alarm light ON', 'I-240G w/CAT6 on LAN1', 'I-240G without lights/No Power', 'G-010S SFP', 'FXA5000', 'XS-250X w/RED Fail light ON', 'XS-250X w/CAT6 on 10G', 'XS-250X without light / No Power'],
        list2: ['T3200 w/Internet & WiFi light GREEN / CAT6 on WAN port', 'T3200 w/Internet YELLOW & Wifi GREEN / CAT6 on WAN port', 'T3200 w/Internet ORANGE & Wifi GREEN / CAT6 on WAN port', 'T3200 w/Internet RED & Wifi GREEN / CAT6 on WAN port', 'T3200 without lights / No Power', 'TWH w/GREEN light + BLUE Wifi light / CAT6 on LAN/WAN', 'TWH w/FLASHING GREEN light + BLUE Wifi light / CAT6 on LAN/WAN', 'TWH w/RED light + BLUE Wifi light / CAT6 on LAN/WAN', 'TWH without light / No Power', 'NAH w/GREEN light / CAT6 on 10G', 'NAH w/FLASHING GREEN light / CAT6 on 10G', 'NAH w/RED light / CAT6 on 10G', 'NAH without light / No Power', 'Cx Using 3rd party Modem'],
        list3: ['BWv1 w/BLUE light / WIRED', 'BWv1 w/FLASHING BLUE light / WIRELESS', 'BWv1 w/RED light / WIRED', 'BWv1 w/RED light / WIRELESS', 'BWv1 without light / No Power', 'BW6 w/GREEN light / CAT6 on 2.5G', 'BW6 w/GREEN light / MoCA connected', 'BW6 w/FLASHING GREEN light / CAT6 on 2.5G', 'BW6 w/RED light / CAT6 on 2.5G', 'BW6 without light / No Power', 'Cx Using 3rd party Booster / Extender'],
        list4: ['2nd BWv1 w/BLUE light / WIRED', '2nd BWv1 w/FLASHING BLUE light / WIRELESS', '2nd BWv1 w/RED light / WIRED', '2nd BWv1 w/RED light / WIRELESS', '2nd BWv1 without light / No Power', '2nd BW6 w/GREEN light / CAT6 on 2.5G', '2nd BW6 w/GREEN light / MoCA connected', '2nd BW6 w/FLASHING GREEN light / CAT6 on 2.5G', '2nd BW6 w/RED light / CAT6 on 2.5G', '2nd BW6 without light / No Power']
    },
    'HighSpeed / Copper': {
        list1: ['T3200 + Internet & WiFi light GREEN', 'T3200 + Internet YELLOW & Wifi GREEN', 'T3200 + Internet ORANGE & Wifi GREEN', 'T3200 + Internet RED & Wifi GREEN'],
        list2: ['1DSL with GREEN light ON', '2DSL with GREEN light ON', '2DSL / 1 is GREEN and 2 is OFF', '1DSL with NO LIGHT', '2DSL with NO LIGHT', 'DSL conneced WRONG'],
        list3: ['BWv1 w/BLUE light / WIRED', 'BWv1 w/FLASHING BLUE light / WIRELESS', 'BWv1 w/RED light / WIRED', 'BWv1 w/RED light / WIRELESS', 'BWv1 without light / No Power'],
        list4: ['2nd BWv1 w/BLUE light / WIRED', '2nd BWv1 w/FLASHING BLUE light / WIRELESS', '2nd BWv1 w/RED light / WIRED', '2nd BWv1 w/RED light / WIRELESS', '2nd BWv1 without light / No Power']
    },
    'Optik TV (Legacy)': {
        list1: ['_VIP5662w', 'VIP5602w', 'VIP5602wt', '_UIW8001', 'UIW4001', 'UIW4001e', '_CIS430', 'CIS330', '_IPN430', 'IPN330', '_ISB7050', '_ISB7150', 'ISB7100', 'ISB7105', '_IPV6015', '_IPV6016', 'IPV5050'],
        list2: ['Power NOT connected', 'Power connected / NO LIGHTS', 'Power connected properly / Powered ON', 'Power connected properly / In Stanby', 'Power connected properly / Not Reachable'],
        list3: ['Connected WIRELES', 'Connected WIRED to T3200', 'C onnected WIRED to Extender', 'Connected WIRED to TWH', 'Connected WIRED to NAH', 'Connected WIRED to BW6', 'Connected WIRED to WallJack', 'Connected WIRED to MoCa', 'Connected WIRED to Ethernet Splitter', 'Non Wired / Wireless connection'],
        list4: ['HDMI connected / Input selected properly', 'HDMI connected / wrong Input selected'],
        list5: ['Not Available', 'No Error Found', 'Critical Errors Found', 'Major Errors Found', 'Minor Errors Found'],
        list6: ['Not Available', 'No Packet Loss', 'A Few Packet Loss', 'Some Packet Loss', 'Too Many Packet']
    },
    'Optik TV (Evo)': {
        list1: ['Telus TV-21T', 'Telus TV-24S'],
        list2: ['Power NOT connected', 'Power connected / White Light', 'Power connected / Blue Light', 'Power connected / NO LIGHTS'],
        list3: ['Connected WIRELES', 'Connected WIRED to T3200', 'Connected WIRED to Extender', 'Connected WIRED to TWH', 'Connected WIRED to NAH', 'Connected WIRED to BW6', 'Connected WIRED to WallJack', 'Connected WIRED to MoCa', 'Connected WIRED to Ethernet Splitter', 'Non Wired / Wireless connection'],
        list4: ['HDMI connected / Input selected properly', 'HDMI connected / wrong Input selected']
    },
    'Pik TV': {
        list1: ['Telus TV-21T', 'Telus TV-24S'],
        list2: ['Power NOT connected', 'Power connected / White Light', 'Power connected / Blue Light', 'Power connected / NO LIGHTS'],
        list3: ['Connected WIRELES', 'Connected WIRED to T3200', 'Connected WIRED to Extender', 'Connected WIRED to TWH', 'Connected WIRED to NAH', 'Connected WIRED to BW6', 'Connected WIRED to WallJack', 'Connected WIRED to MoCa', 'Connected WIRED to Ethernet Splitter', 'Non Wired / Wireless connection'],
        list4: ['HDMI connected / Input selected properly', 'HDMI connected / wrong Input selected']
    },
    'HomePhone / Fiber': {
        list1: ['G-240G w/RJ11 on POTS1 port', 'I-240G w/RJ11 on POTS1 port', 'G-010S SFP', 'XS-250X w/RJ11 on TEL1 port'],
        list2: ['NAH w/GREEN light / RJ11 connected to Phone port'],
        list3: ['HomePhone connected in spare Room using wall jack', 'HomePhone connected directly to ONT'],
        list4: ['Single home set affected', 'Multiple home sets affected', 'All Home sets affected']
    },
    'SHS Legacy': {
        list1: ['IQ PANEL 2', 'IQ PANEL 4', 'Other Panel']
    },
};

export const physicalCheckLabels = {
    'HighSpeed / Fiber': { list1: 'ONT/GATEWAY', list2: 'MODEM/GATEWAY', list3: 'BOOSTER/EXTENDER', list4: 'EXTRA BOOSTER' },
    'HighSpeed / Copper': { list1: 'GATEWAY', list2: 'DSL STATUS', list3: 'BOOSTER/EXTENDER', list4: 'EXTRA BOOSTER' },
    'Optik TV (Legacy)': { list1: 'STB / PVR', list2: 'POWER STATUS', list3: 'INTERNET STATUS', list4: 'HDMI STATUS' },
    'Optik TV (Evo)': { list1: 'TV BOX', list2: 'POWER STATUS', list3: 'INTERNET STATUS', list4: 'HDMI STATUS' },
    'Pik TV': { list1: 'TV BOX', list2: 'POWER STATUS', list3: 'INTERNET STATUS', list4: 'HDMI STATUS' },
    'HomePhone / Fiber': { list1: 'ONT/GATEWAY', list2: 'PHONE CABLE', list3: 'CONNECTION', list4: 'PHONE SETS' },
    'SHS Legacy': { list1: 'IQ PANEL', list2: 'DEVICE', list3: 'CONDITION', list4: 'XYZ' },
    'Other': { list1: 'Customer Equipment', list2: 'No Specific Equipment', list3: '', list4: '' }
};

export const allAwaAlertsOptionsFFH = [
    'N/A', 'No Errors / Alerts Found on AWA', 'AWA not available / nonexistent', 'Unable to get AWA. Modem not managed by HDM', 'Unable to get AWA. ONT Not ranged', 'Unable to get AWA. Cx using third party Gateway', 'Unable to get AWA. No sync on Modem', 'Broadband DOWNSTREAM congestion (cx using more than 80% of the speed plan)', 'Broadband UPSTREAM congestion (cx using more than 80% of the speed plan)', 'Average Wi-Fi speed is slower than the Broadband for many devices connected',
    'Occasional Slowspeed in ONE device', 'Occasional Slowspeed in some devices', 'Occasional Disconnections in ONE device', 'Occasional Disconnections in some devices', 'Devices operating in legacy WiFi Mode', 'Multiple gateway/modem reboots', 'Password problems', 'Low-memory issues detected in the router', 'High number of devices connected detected', 'The gateways has been disconnecting from the service provider network (PPP down)'
];
export const allAwaAlertsOptionsSHS = [
    'No Active Trouble Conditions', 'Dual Path Communication Failure', 'Radio Not Responding', 'AC Power Failure', 'Customer NOT Arming system from app (past 2 weeks)',
    'No Errors Found', 'Sensor Low Battery', 'Panel Low Battery', 'Device Low Battery', 'Tamper Alert', 'Device Bypassed', 'IDLE'
];
export const awaStepsOptionsFFH = ['Advice cx about AWA alerts but is not facing the problems so far. (everything working fine on their end). No TS needed/performed about this', 'Advice cx about issues but cx dont want to troubheshoot this now', 'Inform cx about the problem. Offer WiFi Plus and cx refuses for now, but he will think about the feature', 'Inform cx about the problem. Cx already paying for Wifi Plus. No actions taken', 'Advice cx about issues. Most likely this alerts are causing the problem. Proceed with troubleshooting for the AWA alerts', 'Advice cx about the problem. Suggest internet plan speed upgrade or disconnect some devices from network', 'Advice cx about the problem. Suggest internet plan speed upgrade or disconnect some devices from network. Cx will take a look at that later. No TS performed'];
export const awaStepsOptionsSHS = ['Device not Responding', 'Video Quota Exceeded', 'Video Rule not configured', 'Video Device - No DDNS Messages', 'Malfunction (Z-Wave)', 'Malfunction (Sensor)', 'Malfunction (LiftMaster)'];
export const extraStepsOptions = ['Advice cx about new equipment delivery (3 to 5 business days)', 'Provide instructions for the installation of new equipment | Use go/send to share "How to" video/Instructions', 'Inform about the Equipment Return process | Share instructions with go/send', 'Use go/send to share PIN reset instructions', 'Use go/send to share "How To" video / Instructions', 'Perform a consultation with PIWS based on workflow suggestion', 'Fill the Connect APP Feedback. Advice cx about 7 to 10 days waiting time for the response. Share instructions to try again in the next 7 days. '];

export const issueOptions = {
    'HighSpeed / Fiber': ['ONT Not Ranged', 'Intermittent Connectivity', 'No Dataflow', 'No IP', 'SlowSpeed', 'WiFi Disconnects', 'WiFi Can\'t Connect', 'Can\'t Browse some Websites'],
    'HighSpeed / Copper': ['No Sync', 'Intermittent Connectivity', 'No Dataflow', 'No IP', 'SlowSpeed', 'WiFi Disconnects', 'WiFi Can\'t Connect', 'Can\'t Browse some Websites'],
    'Optik TV (Legacy)': ['STB no Boot', 'No Video Issues', 'Video Quality Issues', 'Channel Issues', 'Recording Issue', 'Audio Issues', 'Remote Control Issues', 'Apps Issues', 'VOD / PPV Issues', 'Asks for a Reg Code', 'Telus TV+ App'],
    'Optik TV (Evo)': ['STB no Boot', 'No Video Issues', 'Video Quality Issues', 'Channel Issues', 'Recording Issue', 'Audio Issues', 'Remote Control Issues', 'Apps Issues', 'VOD / PPV Issues', 'Login Issues', 'IPG / Menu Issues', 'Telus TV+ App', 'Power Cable Issue'],
    'Pik TV': ['STB no Boot', 'No Video Issues', 'Video Quality Issues', 'Channel Issues', 'Recording Issue', 'Audio Issues', 'Remote Control Issues', 'Apps Issues', 'VOD / PPV Issues', 'Login Issues', 'IPG / Menu Issues', 'Telus TV+ App', 'Power Cable Issue'],
    'HomePhone / Fiber': ['No Dial Tone', 'Can\'t be Called', 'Can\'t Call Out', 'Call Cuts Off', 'Can\'t be Heard', 'Noise on the Line', 'Long Distance issue', 'Physical Issues', 'Nuisance Calls', 'Other on the Line', 'Cable / Drop / Terminal issue', 'Call Display', 'VoiceMail Issues', 'Porting Number'],
    'HomePhone / Copper': ['No Dial Tone', 'Can\'t be Called', 'Can\'t Call Out', 'Can\'t be Heard', 'Noise on the Line', 'Long Distance issue', 'Physical Issues', 'Nuisance Calls', 'Other on the Line', 'Cable / Drop / Terminal issue', 'Call Display', 'VoiceMail Issues', 'Porting Number'],
    'Telus Email': ['Login Issues', 'Password Issues', 'Account Deleted', 'Email Creation', 'Functionality', 'Third Party app issues'],
    'MyTelus': ['Login Issues', 'Verification Code Issue', 'Password Reset Issues', 'Account Locked', 'BackUp Email', 'Change Email', 'Create Account', 'MyTelus APP issues'],
    'TOS': ['Unable to Login', 'Not Active', 'Upgrade Subscription'],
    'Telus Connect App': ['Login Issues', 'Missing Equipment', 'Feature Issue'],
    'SHS Legacy': ['Login / Password Issues', 'WebPage Portal Portal Issues', 'APP Issues', 'General Issues', 'Main Panel', 'Secondary Panel', 'Door / Window Sensor', 'Motion Sensor', 'Smoke Detector', 'CO Detector', 'Glass Break Detector', 'Thermostat', 'InDoor Camera', 'OutDoor Camera', 'Doorbell Camera', 'DoorLock', 'Garage Door Controller', 'Smart Automation Devices', 'CMS inquiry', 'Wi-Fi Issues'],
    'SHS ADT / Acquisition / Custom Home': ['No issues provided for this category'],
    'Living Well Companion': ['Base Not Working', 'Pendant Not Working', 'Emergency Contacts', 'LWC Apple Watch APP', 'Self Install Inquiries', 'CMS ACCOUNT NUMBER'],
    'Other': ['Billing Issues', 'IPD Suspension', 'Ghost Call', 'Where is my Tech?', 'Same Day Appointment Cancell', 'Where is my equipment?']
};
