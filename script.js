/**
 * @summary Script for a note-taking application for call center agents.
 * @description Manages the creation, saving, editing, and viewing of call notes.
 * Works serverless, using IndexedDB (with Dexie.js) for data persistence.
 * The interface updates dynamically based on user selections.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: The DOM has been loaded. Initializing the application...');

    // =================================================================================
    // 1. GLOBAL CONFIGURATION AND STATE
    // =================================================================================

    // ------------------------------------------
    // A. Application Constants and Database Configuration
    // ------------------------------------------
    const CHARACTER_LIMIT = 995;
    const TWO_PART_SPLIT_THRESHOLD = 995;
    const TS_PROCESS_THREE_PART_THRESHOLD = 600;
    const RESOLUTION_COPY_CHAR_LIMIT = 999;
    const TS_CHAR_ORANGE_THRESHOLD = 875;
    const TS_CHAR_RED_THRESHOLD = 985;
    const AGENT_NAME_KEY = 'agentNameSaved';
    const APP_VERSION_KEY = 'appVersion';

    // DEXIE.JS: INDEXEDDB DATABASE CONFIGURATION
    const db = new Dexie('tsNotesAppDB');
    db.version(1).stores({
        notes: 'id, timestamp', // Notes table. 'id' is the primary key, 'timestamp' is an index for sorting.
        settings: 'key' // Simple settings table (e.g., for agent name). 'key' is the primary key.
    });

    // ------------------------------------------
    // B. Global State Variables
    // ------------------------------------------
    let _currentFinalNoteContent = '';
    let _lastNoteIdBeforeModalTransition = null;
    let isEditingNoteFlag = false;
    let currentViewedNoteId = null;
    let currentEditingNoteId = null;
    let _currentlyViewedNoteData = null;
    let _historyNotesCache = [];
    let highlightTimeout = null;
    let resolveConfirmPromise;
    let isAgentNameEditable = false;
    let _awaitingChecklistCompletionForCopySave = false;

    // ------------------------------------------
    // C. Field and Data Configuration
    // ------------------------------------------
    const fieldConfig = {
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
        'outage': { label: 'Outage', required: false, type: 'radio' },
        'errorsInNC': { label: 'NetCracker', required: false, type: 'radio' },
        'accountSuspended': { label: 'Suspended', required: false, type: 'radio' },
        'skillToggle': { label: 'SKILL', required: true, type: 'checkbox' },
        'serviceSelect': { label: 'SERVICE', required: true, type: 'select' },
        'issueSelect': { label: 'WORKFLOW', required: true, type: 'select' },
        'cxIssueText': { label: 'CX ISSUE', required: true, type: 'textarea' },
        'affectedText': { label: 'AFFECTED', required: false, type: 'textarea', conditional: true },
        'physicalCheckList1Select': { label: 'ONT/GATEWAY', required: false, type: 'select' },
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
        'awaAlertsSelect': { label: 'AWA ALERTS', required: false, type: 'select' },
        'awaAlerts2Select': { label: 'AWA ALERTS 2', required: false, type: 'select', conditional: true },
        'enableAwaAlerts2': { label: 'Enable AWA 2', required: false, type: 'checkbox' },
        'awaStepsSelect': { label: 'AWA STEPS', required: false, type: 'select', conditional: true },
        'activeDevicesInput': { label: 'ACTIVE DEVICES', required: false, type: 'text' },
        'totalDevicesInput': { label: 'TOTAL DEVICES', required: false, type: 'text' },
        'downloadBeforeInput': { label: 'DL BEFORE', required: false, type: 'text' },
        'uploadBeforeInput': { label: 'UP BEFORE', required: false, type: 'text' },
        'downloadAfterInput': { label: 'DL AFTER', required: false, type: 'text' },
        'uploadAfterInput': { label: 'UP AFTER', required: false, type: 'text' },
        'tvsSelect': { label: 'TVS', required: true, type: 'select' },
        'tvsKeyInput': { label: 'TVS KEY', required: true, type: 'text', conditional: true },
        'extraStepsSelect': { label: 'EXTRA STEPS', required: false, type: 'select' },
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

    const numericFields = [
        'ban', 'cid', 'cbr',
        'activeDevicesInput', 'totalDevicesInput',
        'downloadBeforeInput', 'uploadBeforeInput',
        'downloadAfterInput', 'uploadAfterInput',
        'ticketInput', 'csrOrderInput'
    ];

    const SERVICES_TO_HIDE_PHYSICAL_CHECK = [
        'Telus Email', 'MyTelus', 'TOS', 'Telus Connect App', 'Living Well Companion', 'SHS ADT / Acquisition / Custom Home', 'Other'
    ];
    const shsDeviceOptionsMap = {
        'InDoor Camera': ['ADC - V522', 'ADC - V523 / 523x'],
        'OutDoor Camera': ['ADC - V722w', 'ADC - V722 / 723x', 'ADC - V724'],
        'Doorbell Camera': ['SKYBELL/ADC - VDB105', 'ADC - VDB750', 'SKYBELL HD'],
        'DoorLock': ['Weiser 620', 'Weiser 10 TouchPad'],
        'Garage Door Controller': ['LiftMaster', 'GoControl'],
        'Main Panel': ['One Device Affected', 'Some Devices Affected', 'Multiple Devices Affected'],
        'Motion Sensor': ['Motion Sensor']
    };
    const directIssueToDeviceMap = ['Smoke Detector', 'CO Detector', 'Glass Break Detector', 'Thermostat'];
    const shsIssuesToDisableDevice = [
        'Login / Password Issues', 'WebPage Portal Issues', 'APP Issues',
        'CMS inquiry', 'Smart Automation Devices', 'Wi-Fi Issues', 'Secondary Panel'
    ];
    const equipmentOptions = {
        'HighSpeed / Fiber': {
            list1: ['G-240G w/RED Fail light ON', 'G-240G w/CAT6 on DATA1', 'G-240G without lights/No Power', 'I-240G w/RED Alarm light ON', 'I-240G w/CAT6 on LAN1', 'I-240G without lights/No Power', 'G-010S SFP', 'XS-250X w/RED Fail light ON', 'XS-250X w/CAT6 on 10G', 'XS-250X without light / No Power'],
            list2: ['T3200 w/Internet & WiFi light GREEN / CAT6 on WAN port', 'T3200 w/Internet YELLOW & Wifi GREEN / CAT6 on WAN port', 'T3200 w/Internet ORANGE & Wifi GREEN / CAT6 on WAN port', 'T3200 w/Internet RED & Wifi GREEN / CAT6 on WAN port', 'T3200 without lights / No Power', 'TWH w/GREEN light + BLUE Wifi light / CAT6 on LAN/WAN', 'TWH w/FLASHING GREEN light + BLUE Wifi light / CAT6 on LAN/WAN', 'TWH w/RED light + BLUE Wifi light / CAT6 on LAN/WAN', 'TWH without light / No Power', 'NAH w/GREEN light / CAT6 on 10G', 'NAH w/FLASHING GREEN light / CAT6 on 10G', 'NAH w/RED light / CAT6 on 10G', 'NAH without light / No Power'],
            list3: ['BWv1 w/BLUE light / WIRED', 'BWv1 w/FLASHING BLUE light / WIRELESS', 'BWv1 w/RED light / WIRED', 'BWv1 w/RED light / WIRELESS', 'BWv1 without light / No Power', 'BW6 w/GREEN light / CAT6 on 2.5G', 'BW6 w/GREEN light / MoCA connected', 'BW6 w/FLASHING GREEN light / CAT6 on 2.5G', 'BW6 w/RED light / CAT6 on 2.5G', 'BW6 without light / No Power'],
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
            list5: ['Critical Errors Found', 'Major Errors Found', 'Minor Errors Found', 'No Error Found'], // xVu Status
            list6: ['No Packet Loss', 'A Few Packet Loss', 'Some Packet Loss', 'Too Many Packet'] // Packet Loss
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
        'HomePhone / Copper': {
            list1: ['1', '2'], list2: ['1', '2'], list3: ['1', '2'], list4: ['1', '2']
        },
        'SHS Legacy': {
            list1: ['IQ PANEL 2', 'IQ PANEL 4', 'Other Panel']
        },
        'Other': {
            list1: ['Customer Equipment', 'No Specific Equipment'], list2: [''], list3: [''], list4: ['']
        }
    };
    const physicalCheckLabels = {
        'HighSpeed / Fiber': { list1: 'ONT/GATEWAY', list2: 'MODEM/GATEWAY', list3: 'BOOSTER/EXTENDER', list4: 'EXTRA BOOSTER' },
        'HighSpeed / Copper': { list1: 'GATEWAY', list2: 'DSL STATUS', list3: 'BOOSTER/EXTENDER', list4: 'EXTRA BOOSTER' },
        'Optik TV (Legacy)': { list1: 'STB / PVR', list2: 'POWER STATUS', list3: 'INTERNET STATUS', list4: 'HDMI STATUS' },
        'Optik TV (Evo)': { list1: 'TV BOX', list2: 'POWER STATUS', list3: 'INTERNET STATUS', list4: 'HDMI STATUS' },
        'Pik TV': { list1: 'TV BOX', list2: 'POWER STATUS', list3: 'INTERNET STATUS', list4: 'HDMI STATUS' },
        'HomePhone / Fiber': { list1: 'ONT/GATEWAY', list2: 'PHONE CABLE', list3: 'CONNECTION', list4: 'PHONE SETS' },
        'HomePhone / Copper': { list1: 'ONT/GATEWAY', list2: 'MODEM/GATEWAY', list3: 'BOOSTER/EXTENDER', list4: 'EXTRA BOOSTER' },
        'SHS Legacy': { list1: 'IQ PANEL', list2: 'DEVICE', list3: 'CONDITION', list4: 'XYZ' },
        'Other': { list1: 'Customer Equipment', list2: 'No Specific Equipment', list3: '', list4: '' }
    };
    const awaAlertsOptionsFFH = ['No Errors / Alerts Found on AWA', 'Unable to get AWA. Modem not managed by HDM', 'Unable to get AWA. ONT Not ranged', 'Unable to get AWA. Cx using third party Gateway', 'Unable to get AWA. No sync on Modem', 'Broadband DOWNSTREAM congestion (cx using more than 80% of the speed plan)', 'Broadband UPSTREAM congestion (cx using more than 80% of the speed plan)', 'Average Wi-Fi speed is slower than the Broadband for many devices connected'];
    const awaAlerts2OptionsFFH = ['Occasional Slowspeed in ONE device', 'Occasional Slowspeed in some devices', 'Occasional Disconnections in ONE device', 'Occasional Disconnections in some devices', 'Devices operating in legacy WiFi Mode', 'Multiple gateway/modem reboots', 'Password problems', 'Low-memory issues detected in the router', 'High number of devices connected detected', 'The gateways has been disconnecting from the service provider network (PPP down)'];
    const awaAlertsOptionsSHS = ['No Active Trouble Conditions', 'Dual Path Communication Failure', 'Radio Not Responding', 'AC Power Failure', 'Customer NOT Arming system from app (past 2 weeks)'];
    const awaAlerts2OptionsSHS = ['No Errors Found', 'Sensor Low Battery', 'Panel Low Battery', 'Device Low Battery', 'Tamper Alert', 'Device Bypassed', 'IDLE'];
    const awaStepsOptionsFFH = ['Advice cx about AWA alerts but is not facing the problems so far. (everything working fine on their end). No TS needed/performed about this', 'Advice cx about issues but cx dont want to troubheshoot this now', 'Inform cx about the problem. Offer WiFi Plus and cx refuses for now, but he will think about the feature', 'Inform cx about the problem. Cx already paying for Wifi Plus. No actions taken', 'Advice cx about issues. Most likely this alerts are causing the problem. Proceed with troubleshooting for the AWA alerts', 'Advice cx about the problem. Suggest internet plan speed upgrade or disconnect some devices from network', 'Advice cx about the problem. Suggest internet plan speed upgrade or disconnect some devices from network. Cx will take a look at that later. No TS performed'];
    const awaStepsOptionsSHS = ['Device not Responding', 'Video Quota Exceeded', 'Video Rule not configured', 'Video Device - No DDNS Messages', 'Malfunction (Z-Wave)', 'Malfunction (Sensor)', 'Malfunction (LiftMaster)'];
    const extraStepsOptions = ['Advice cx about new equipment delivery (3 to 5 business days)', 'Provide instructions for the installation of new equipment | Use go/send to share "How to" video/Instructions', 'Inform about the Equipment Return process | Share instructions with go/send', 'Use go/send to share PIN reset instructions', 'Use go/send to share "How To" video / Instructions', 'Perform a consultation with PIWS based on workflow suggestion', 'Fill the Connect APP Feedback. Advice cx about 7 to 10 days waiting time for the response. Share instructions to try again in the next 7 days. '];
    const issueOptions = {
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

    // =================================================================================
    // 2. DOM ELEMENT REFERENCES
    // =================================================================================
    const get = (id) => document.getElementById(id);

    // Main Form
    const agentNameInput = get('agentName');
    const editAgentNameBtn = get('editAgentNameBtn');
    const mainNoteCharCountHeader = get('mainNoteCharCountHeader');
    const banInput = get('ban');
    const cidInput = get('cid');
    const nameInput = get('name');
    const cbrInput = get('cbr');
    const callerSelect = get('caller');
    const xidFieldContainer = get('xidFieldContainer');
    const xidInput = get('xid');
    const verifiedBySelect = get('verifiedBy');
    const addressInput = get('address');
    const outageRadioGroupElements = document.querySelectorAll('input[name="outage"]');
    const errorsInNCRadioGroupElements = document.querySelectorAll('input[name="errorsInNC"]');
    const accountSuspendedRadioGroupElements = document.querySelectorAll('input[name="accountSuspended"]');
    const serviceOnCsrSelect = get('serviceOnCsr');
    const serviceSelect = get('serviceSelect');
    const issueSelect = get('issueSelect');
    const cxIssueText = get('cxIssueText');
    const troubleshootingProcessText = get('troubleshootingProcessText');
    const affectedText = get('affectedText');
    const affectedTextGroup = get('affectedTextRow');
    const affectedLabel = get('affectedLabel');
    const serviceAffectedRow = get('affectedTextRow');
    const physicalCheckListsContainer = get('physicalCheckListsContainer');
    const physicalCheckList1Select = get('physicalCheckList1Select');
    const physicalCheckList2Select = get('physicalCheckList2Select');
    const physicalCheckList3Select = get('physicalCheckList3Select');
    const physicalCheckList4Select = get('physicalCheckList4Select');
    const enablePhysicalCheck2 = get('enablePhysicalCheck2');
    const enablePhysicalCheck3 = get('enablePhysicalCheck3');
    const enablePhysicalCheck4 = get('enablePhysicalCheck4');
    const physicalCheckList1Label = get('physicalCheckList1Label');
    const physicalCheckList2Label = get('physicalCheckList2Label');
    const physicalCheckList3Label = get('physicalCheckList3Label');
    const physicalCheckList4Label = get('physicalCheckList4Label');
    const optikTvLegacySpecificFieldsContainer = get('optikTvLegacySpecificFields');
    const xVuStatusSelect = get('xVuStatusSelect');
    const packetLossSelect = get('packetLossSelect');
    const awaAlertsSelect = get('awaAlertsSelect');
    const awaAlerts2Select = get('awaAlerts2Select');
    const enableAwaAlerts2 = get('enableAwaAlerts2');
    const awaAlertsSelectLabel = document.querySelector('label[for="awaAlertsSelect"]');
    const awaAlerts2SelectLabel = document.querySelector('label[for="awaAlerts2Select"]');
    const awaStepsSelect = get('awaStepsSelect');
    const awaStepsSelectLabel = document.querySelector('label[for="awaStepsSelect"]');
    const activeDevicesInput = get('activeDevicesInput');
    const totalDevicesInput = get('totalDevicesInput');
    const downloadBeforeInput = get('downloadBeforeInput');
    const uploadBeforeInput = get('uploadBeforeInput');
    const downloadAfterInput = get('downloadAfterInput');
    const uploadAfterInput = get('uploadAfterInput');
    const activeDevicesGroup = activeDevicesInput ? activeDevicesInput.closest('.input-group') : null;
    const totalDevicesGroup = totalDevicesInput ? totalDevicesInput.closest('.input-group') : null;
    const downloadBeforeGroup = downloadBeforeInput ? downloadBeforeInput.closest('.input-group') : null;
    const uploadBeforeGroup = uploadBeforeInput ? uploadBeforeInput.closest('.input-group') : null;
    const downloadAfterGroup = downloadAfterInput ? downloadAfterInput.closest('.input-group') : null;
    const uploadAfterGroup = uploadAfterInput ? uploadAfterInput.closest('.input-group') : null;
    const tvsSelect = get('tvsSelect');
    const tvsKeyInput = get('tvsKeyInput');
    const tvsKeyFieldContainer = get('tvsKeyFieldContainer');
    const extraStepsSelect = get('extraStepsSelect');
    const resolvedSelect = get('resolvedSelect');
    const transferCheckbox = get('transferCheckbox');
    const transferSelect = get('transferSelect');
    const csrOrderInput = get('csrOrderInput');
    const ticketInput = get('ticketInput');
    const cbr2FieldContainer = get('cbr2FieldContainer');
    const aocFieldContainer = get('aocFieldContainer');
    const dispatchDateInputContainer = get('dispatchDateInputContainer');
    const dispatchTimeSlotSelectContainer = get('dispatchTimeSlotSelectContainer');
    const cbr2Input = get('cbr2Input');
    const aocInput = get('aocInput');
    const dispatchDateInput = get('dispatchDateInput');
    const dispatchTimeSlotSelect = get('dispatchTimeSlotSelect');
    const cbr2Label = get('cbr2Label');
    const dispatchDateLabel = get('dispatchDateLabel');
    const dispatchTimeLabel = get('dispatchTimeLabel');
    const skillToggle = get('skillToggle');
    const skillTextIndicator = get('skill-text-indicator');
    const troubleshootingCharCountSpan = get('troubleshootingCharCount');
    const toastContainer = get('toast-container');
    const btnSee = get('btnSee');
    const btnSave = get('btnSave');
    const btnReset = get('btnReset');
    const btnHistory = get('btnHistory');
    const callNoteForm = get('callNoteForm');
    const sections = document.querySelectorAll('.form-section');
    const appVersionDisplay = get('appVersionDisplay');

    // Modals
    const noteModalOverlay = get('noteModalOverlay');
    const modalNoteTextarea = get('modalNoteTextarea');
    const modalCopyBtn = get('modalCopyBtn');
    const modalCopilotBtn = get('modalCopilotBtn');
    const modalCopySaveBtn = get('modalCopySaveBtn');
    const modalSeparateBtn = get('modalSeparateBtn');
    const modalResolutionBtn = get('modalResolutionBtn');
    const modalEditFromHistoryBtn = get('modalEditFromHistoryBtn');
    const modalCloseBtn = get('modalCloseBtn');
    const modalCloseBtnBottom = get('modalCloseBtnBottom');
    const modalNoteCharCount = get('modalNoteCharCount');
    const separateNoteModalOverlay = get('separateNoteModalOverlay');
    const separateModalCloseBtn = get('separateModalCloseBtn');
    const separateModalCopySaveBtn = get('separateModalCopySaveBtn');
    const separateModalResolutionBtn = get('separateModalResolutionBtn');
    const separateModalCopilotBtn = get('separateModalCopilotBtn');
    const customConfirmModal = get('customConfirmModal');
    const confirmMessage = get('confirmMessage');
    const confirmYesBtn = get('confirmYesBtn');
    const confirmNoBtn = get('confirmNoBtn');
    
    // History Sidebar
    const historySidebar = get('historySidebar');
    const closeSidebarBtn = get('closeHistoryBtn');
    const noteHistoryList = get('noteHistoryList');
    const historySidebarOverlay = get('history-sidebar-overlay');
    const historySearchInput = get('historySearchInput');
    const noNotesMessage = get('noNotesMessage');
    // --- BEGIN: Import/Export Elements ---
    const exportBtn = get('exportBtn');
    const importBtn = get('importBtn');
    const importFile = get('importFile');
    // --- END: Import/Export Elements ---

    // Checklist Sidebar
    const btnChecklistMenu = get('btnChecklistMenu');
    const checklistSidebar = get('checklistSidebar');
    const closeChecklistBtn = get('closeChecklistBtn');
    const checklistSidebarOverlay = get('checklist-sidebar-overlay');
    const btnChecklistYesAll = get('btnChecklistYesAll');
    const goCheckPhysicalLink = get('goCheckPhysicalLink');
    const goTsCopilotLink = get('goTsCopilotLink');
    
    // Feedback Modal
    const feedbackBtn = get('feedback-btn');
    const feedbackModalOverlay = get('feedbackModalOverlay');
    const closeFeedbackModalBtn = get('closeFeedbackModalBtn');

    // Welcome Modal
    const welcomeModalOverlay = get('welcomeModalOverlay');
    const welcomeAppVersionDisplay = get('welcomeAppVersionDisplay');
    const welcomeAgentNameInput = get('welcomeAgentNameInput');
    const startTakingNotesBtn = get('startTakingNotesBtn');


    // =================================================================================
    // 3. MAIN APPLICATION LOGIC
    // =================================================================================

    const _getFieldValue = (id, sourceData = null) => {
        if (sourceData) {
            if (id === 'skillToggle') {
                return sourceData.skill === 'SHS';
            }
            if (sourceData[id] !== undefined) {
                return sourceData[id];
            }
            const radioName = Object.keys(sourceData).find(key => key === id);
            return radioName ? sourceData[radioName] : '';
        }

        const element = get(id);
        if (element) {
            if (element.tagName === 'SELECT' || element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'date' || element.type === 'number'))) {
                return element.value.trim();
            } else if (element.type === 'radio') {
                const radioButtons = document.querySelectorAll(`input[name="${id}"]`);
                for (const radio of radioButtons) {
                    if (radio.checked) return radio.value;
                }
                return '';
            } else if (element.type === 'checkbox') {
                return element.checked;
            }
        } else {
            const radioButtonsByName = document.querySelectorAll(`input[name="${id}"]`);
            if (radioButtonsByName.length > 0) {
                for (const radio of radioButtonsByName) {
                    if (radio.checked) return radio.value;
                }
            }
        }
        return '';
    };

    const _buildSection1Content = (sourceData = null) => {
        const parts = [];
        const agentName = _getFieldValue('agentName', sourceData);
        parts.push(`PFTS | ${agentName || ''}`);
        const skillValue = _getFieldValue('skillToggle', sourceData) ? 'SHS' : 'FFH';
        if (skillValue) parts.push(`SKILL: ${skillValue}`);
        const section1FieldOrder = ['ban', 'cid', 'name', 'cbr', 'caller'];
        section1FieldOrder.forEach(fieldId => {
            const value = _getFieldValue(fieldId, sourceData);
            if (value) parts.push(`${fieldConfig[fieldId].label}: ${value}`);
        });
        if (_getFieldValue('caller', sourceData) === 'Consultation' && _getFieldValue('xid', sourceData)) {
            parts.push(`XID: ${_getFieldValue('xid', sourceData)}`);
        }
        ['verifiedBy', 'address', ].forEach(fieldId => {
            const value = _getFieldValue(fieldId, sourceData);
            if (value) parts.push(`${fieldConfig[fieldId].label}: ${value}`);
        });
        return parts;
    };

    const _buildSection2InitialContent = (sourceData = null) => {
        const parts = [];
        if (_getFieldValue('serviceOnCsr', sourceData)) parts.push(`SERVICE ON CSR: ${_getFieldValue('serviceOnCsr', sourceData)}`);
        const outageValue = _getFieldValue('outage', sourceData);
        if (outageValue === 'yes') parts.push('OUTAGE: Active Outage affecting services');
        else if (outageValue === 'no') parts.push('OUTAGE: No Active Outage');
        const errorsInNCValue = _getFieldValue('errorsInNC', sourceData);
        if (errorsInNCValue === 'yes') parts.push('NC: ERROR FOUND in NetCracker');
        else if (errorsInNCValue === 'no') parts.push('NC: No Errors in NetCracker');
        const accountSuspendedValue = _getFieldValue('accountSuspended', sourceData);
        if (accountSuspendedValue === 'yes') parts.push('SUSPENDED: Yes');
        else if (accountSuspendedValue === 'no') parts.push('SUSPENDED: No');
        if (_getFieldValue('serviceSelect', sourceData)) parts.push(`SERVICE: ${_getFieldValue('serviceSelect', sourceData)}`);
        if (_getFieldValue('issueSelect', sourceData)) parts.push(`WORKFLOW: ${_getFieldValue('issueSelect', sourceData)}`);
        
        const affectedTextValue = _getFieldValue('affectedText', sourceData);
        if (affectedTextValue) {
             const service = _getFieldValue('serviceSelect', sourceData);
             let label = 'AFFECTED';
             if (service === 'HomePhone / Fiber' || service === 'HomePhone / Copper') label = 'AFFECTED PHONE NUMBER';
             else if (service === 'Telus Email') label = 'TELUS EMAIL';
             else if (service === 'MyTelus') label = 'MYTELUS EMAIL';
             parts.push(`${label}: ${affectedTextValue}`);
        }

        if (_getFieldValue('cxIssueText', sourceData)) parts.push(`CX ISSUE: ${_getFieldValue('cxIssueText', sourceData)}`);

        const physicalCheckValues = [];
        ['physicalCheckList1Select', 'physicalCheckList2Select', 'physicalCheckList3Select', 'physicalCheckList4Select']
        .forEach(fieldId => {
            if (_getFieldValue(fieldId, sourceData)) {
                physicalCheckValues.push(_getFieldValue(fieldId, sourceData));
            }
        });
        if (physicalCheckValues.length > 0) parts.push(`CHECK PHYSICAL: ${physicalCheckValues.join(', ')}`);

        const xVuValue = _getFieldValue('xVuStatusSelect', sourceData);
        const packetLossValue = _getFieldValue('packetLossSelect', sourceData);
        if (xVuValue || packetLossValue) {
            parts.push(`XVU STATUS: ${xVuValue}${xVuValue && packetLossValue ? ', ' : ''}${packetLossValue}`);
        }
        if (_getFieldValue('additionalinfoText', sourceData)) parts.push(`ADDITIONAL INFO: ${_getFieldValue('additionalinfoText', sourceData)}`);
        return parts;
    };

    const _buildTroubleshootingProcessContent = (sourceData = null) => {
        const parts = [];
        if (_getFieldValue('troubleshootingProcessText', sourceData)) parts.push(`TS STEPS: ${_getFieldValue('troubleshootingProcessText', sourceData)}`);
        return parts;
    };

    const _buildSection3Content = (sourceData = null) => {
        const parts = [];
        const currentSkill = _getFieldValue('skillToggle', sourceData) ? 'SHS' : 'FFH';
        const currentAwaAlertsLabel = currentSkill === 'SHS' ? 'ADC TROUBLE CONDITIONS' : 'AWA ALERTS';

        if (_getFieldValue('awaAlertsSelect', sourceData)) {
            let awaNoteLine = `${currentAwaAlertsLabel}: ${_getFieldValue('awaAlertsSelect', sourceData)}`;
            if (_getFieldValue('enableAwaAlerts2', sourceData) && _getFieldValue('awaAlerts2Select', sourceData)) {
                awaNoteLine += `, ${_getFieldValue('awaAlerts2Select', sourceData)}`;
            }
            if (_getFieldValue('awaStepsSelect', sourceData)) {
                awaNoteLine += `, ${_getFieldValue('awaStepsSelect', sourceData)}`;
            }
            parts.push(awaNoteLine);
        }

        if (currentSkill !== 'SHS') {
            const activeDevices = _getFieldValue('activeDevicesInput', sourceData);
            const totalDevices = _getFieldValue('totalDevicesInput', sourceData);
            if (activeDevices || totalDevices) parts.push(`ACTIVE/TOTAL DEVICES: ${activeDevices || ''} / ${totalDevices || ''}`);
            const downloadBefore = _getFieldValue('downloadBeforeInput', sourceData);
            const uploadBefore = _getFieldValue('uploadBeforeInput', sourceData);
            const downloadAfter = _getFieldValue('downloadAfterInput', sourceData);
            const uploadAfter = _getFieldValue('uploadAfterInput', sourceData);
            if (downloadBefore || uploadBefore || downloadAfter || uploadAfter) {
                let speedNote = '';
                if (downloadBefore || uploadBefore) speedNote += `DOWN/UP MBPS BEFORE: ${downloadBefore || 'N/A'}Mbps | ${uploadBefore || 'N/A'}Mbps`;
                if (downloadAfter || uploadAfter) {
                    if (speedNote) speedNote += ', ';
                    speedNote += `AFTER: ${downloadAfter || 'N/A'}Mbps | ${uploadAfter || 'N/A'}Mbps`;
                }
                if (speedNote) parts.push(speedNote);
            }
        }
        if (_getFieldValue('tvsSelect', sourceData)) {
            let tvsNote = `TVS : ${_getFieldValue('tvsSelect', sourceData)}`;
            if (_getFieldValue('tvsSelect', sourceData) === 'YES' && _getFieldValue('tvsKeyInput', sourceData)) {
                tvsNote += `, ${_getFieldValue('tvsKeyInput', sourceData)}`;
            }
            parts.push(tvsNote);
        }
        if (_getFieldValue('extraStepsSelect', sourceData)) parts.push(`EXTRA STEPS: ${_getFieldValue('extraStepsSelect', sourceData)}`);
        return parts;
    };

    const _buildSection4Content = (sourceData = null) => {
        const parts = [];
        const resolutionDetails = [];
        const resolvedValue = _getFieldValue('resolvedSelect', sourceData);
        
        if (resolvedValue) {
            resolutionDetails.push(`RESOLVED: ${resolvedValue}`);
            if (resolvedValue === 'No | Tech Booked') {
                if (_getFieldValue('cbr2Input', sourceData)) resolutionDetails.push(`CBR2: ${_getFieldValue('cbr2Input', sourceData)}`);
                if (_getFieldValue('aocInput', sourceData)) resolutionDetails.push(`AOC: ${_getFieldValue('aocInput', sourceData)}`);
                const dispatchDate = _getFieldValue('dispatchDateInput', sourceData);
                const dispatchTime = _getFieldValue('dispatchTimeSlotSelect', sourceData);
                if (dispatchDate && dispatchTime) {
                    const [year, month, day] = dispatchDate.split('-');
                    const dateObj = new Date(year, month - 1, day);
                    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    const dayAbbreviations = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const formattedDate = `${dayAbbreviations[dateObj.getDay()]} ${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;
                    resolutionDetails.push(`DISPATCH: ${formattedDate}, ${dispatchTime}`);
                }
            } else if (resolvedValue === 'No | Follow Up Required' || resolvedValue === 'Cx Need a Follow Up. Set SCB on FVA') {
                const followUpDate = _getFieldValue('dispatchDateInput', sourceData);
                const followUpTime = _getFieldValue('dispatchTimeSlotSelect', sourceData);
                if (followUpDate && followUpTime) {
                    const [year, month, day] = followUpDate.split('-');
                    const dateObj = new Date(year, month - 1, day);
                    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    const dayAbbreviations = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const formattedDate = `${dayAbbreviations[dateObj.getDay()]} ${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;
                    resolutionDetails.push(`FOLLOW UP: ${formattedDate}, ${followUpTime}`);
                }
            } else if (resolvedValue === 'No | BOSR Created') {
                if (_getFieldValue('cbr2Input', sourceData)) resolutionDetails.push(`BOSR TICKET #: ${_getFieldValue('cbr2Input', sourceData)}`);
            } else if (resolvedValue === 'No | NC Ticket Created') {
                if (_getFieldValue('cbr2Input', sourceData)) resolutionDetails.push(`NC TICKET #: ${_getFieldValue('cbr2Input', sourceData)}`);
            } else if (resolvedValue === 'Cx ask for a Manager | Unable to de escalate. Manager still needed | Escalate to EMT') {
                if (_getFieldValue('cbr2Input', sourceData)) resolutionDetails.push(`EMT TICKET #: ${_getFieldValue('cbr2Input', sourceData)}`);
            }
        }
        
        parts.push(...resolutionDetails);

        if (_getFieldValue('transferCheckbox', sourceData) && _getFieldValue('transferSelect', sourceData)) {
            parts.push(`TRANSFER TO ${_getFieldValue('transferSelect', sourceData)}`);
        }
        if (_getFieldValue('csrOrderInput', sourceData)) parts.push(`CSR ORDER: ${_getFieldValue('csrOrderInput', sourceData)}`);
        if (_getFieldValue('ticketInput', sourceData)) parts.push(`TICKET: ${_getFieldValue('ticketInput', sourceData)}`);
        return parts;
    };

    const generateFinalNote = () => {
        let noteContent = [
            ..._buildSection1Content(),
            ..._buildSection2InitialContent(),
            ..._buildTroubleshootingProcessContent(),
            ..._buildSection3Content(),
            ..._buildSection4Content()
        ];
        let rawNote = noteContent.filter(line => line.trim() !== '').join('\n').replace(/\n\s*\n/g, '\n\n').trim();
        _currentFinalNoteContent = rawNote;

        updateCharCounter(rawNote.length, modalNoteCharCount, CHARACTER_LIMIT, false, true);
        updateCharCounter(rawNote.length, mainNoteCharCountHeader, CHARACTER_LIMIT, false, true);
        if (troubleshootingProcessText) updateTroubleshootingCharCounter(troubleshootingProcessText.value.length);
        updateStickyHeaderInfo();
        updateChecklistState(); // Update checklist whenever the note is regenerated
    };

    const saveCurrentNote = async () => {
        const requiredChecklistItems = document.querySelectorAll('.checklist-item[data-required="true"]');
        let allChecklistFilled = true;
        requiredChecklistItems.forEach(item => {
            const radioName = item.querySelector('input[type="radio"]').name;
            if (!document.querySelector(`input[name="${radioName}"]:checked`)) {
                allChecklistFilled = false;
                item.classList.add('checklist-item-required');
            } else {
                item.classList.remove('checklist-item-required');
            }
        });

        if (!allChecklistFilled) {
            showToast('Please complete the required Checklist items.', 'warning');
            checklistSidebar.classList.add('open');
            checklistSidebarOverlay.style.display = 'block';
            
            if (_awaitingChecklistCompletionForCopySave) {
                closeModal(true);
            }
            return false;
        }

        if (isAgentNameEditable) {
            if (!_getFieldValue('agentName')) {
                showToast('Please enter your agent name (PFTS).', 'error');
                if (agentNameInput) {
                    agentNameInput.classList.add('required-initial-border');
                    agentNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    agentNameInput.focus();
                }
                return false;
            }
            await saveAgentName();
        }

        let allRequiredFieldsFilled = true;
        let firstMissingElement = null;

        for (const fieldId in fieldConfig) {
            const config = fieldConfig[fieldId];
            const inputElement = get(fieldId);
            let targetElementOrGroup = inputElement;

            if (config.type === 'radio') {
                targetElementOrGroup = document.querySelectorAll(`input[name="${fieldId}"]`)[0];
            }
            if (!targetElementOrGroup) continue;

            const containerElement = targetElementOrGroup.closest('.input-group') || targetElementOrGroup.closest('.radio-group');
            let isHiddenOrDisabled = (containerElement && (containerElement.style.display === 'none' || containerElement.classList.contains('hidden-field'))) || (inputElement && inputElement.disabled);
            
            const currentSkill = skillToggle.checked ? 'SHS' : 'FFH';
            const isSpeedOrDeviceField = ['activeDevicesInput', 'totalDevicesInput', 'downloadBeforeInput', 'uploadBeforeInput', 'downloadAfterInput', 'uploadAfterInput'].includes(fieldId);
            if (isSpeedOrDeviceField && currentSkill === 'SHS') {
                isHiddenOrDisabled = true;
            }

            if (config.required && !isHiddenOrDisabled) {
                const value = _getFieldValue(fieldId);
                const elementIsMissing = (value === '' || (inputElement && inputElement.tagName === 'SELECT' && value === ''));

                if (config.type === 'radio') {
                    const isChecked = Array.from(document.querySelectorAll(`input[name="${fieldId}"]`)).some(radio => radio.checked);
                    if (!isChecked) {
                        allRequiredFieldsFilled = false;
                        if (containerElement) {
                            containerElement.classList.add('required-initial-border');
                            if (!firstMissingElement) firstMissingElement = containerElement;
                        }
                    } else {
                         if (containerElement) containerElement.classList.remove('required-initial-border');
                    }
                } else if (fieldId !== 'aocInput' && elementIsMissing) {
                    allRequiredFieldsFilled = false;
                    if (inputElement) {
                        inputElement.classList.add('required-initial-border');
                        if (!firstMissingElement) firstMissingElement = inputElement;
                    }
                } else {
                    if (inputElement) inputElement.classList.remove('required-initial-border');
                }
            }
        }

        if (!allRequiredFieldsFilled) {
            showToast(`Please fill all required fields.`, 'error');
            if (firstMissingElement) {
                const parentSection = firstMissingElement.closest('.form-section');
                if (parentSection && parentSection.classList.contains('collapsed')) parentSection.classList.remove('collapsed');
                firstMissingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstMissingElement.focus();
            }
            if (_awaitingChecklistCompletionForCopySave) {
                closeModal(true);
            }
            return false;
        }

        const noteToSave = _currentFinalNoteContent;
        if (noteToSave.trim() === '') {
            showToast('There is no note to save. Please fill the form.', 'warning');
            return false;
        }

        const formData = {};
        const formElements = document.getElementById('callNoteForm').elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name) {
                if (element.type === 'radio') {
                    if (element.checked) formData[element.name] = element.value;
                } else if (element.type === 'checkbox') {
                    formData[element.id] = element.checked;
                } else if (element.id) {
                    formData[element.id] = element.value;
                }
            } else if (element.id && element.tagName === 'SELECT') {
                formData[element.id] = element.value;
            }
        }
        ['outage', 'errorsInNC', 'accountSuspended'].forEach(name => {
            const checkedRadio = document.querySelector(`input[name="${name}"]:checked`);
            if (checkedRadio) formData[name] = checkedRadio.value;
            else formData[name] = '';
        });
        formData.skill = skillToggle.checked ? 'SHS' : 'FFH';

        const checklistItems = checklistSidebar.querySelectorAll('.checklist-item');
        checklistItems.forEach(item => {
            const radioName = item.querySelector('input[type="radio"]').name;
            const checkedRadio = item.querySelector(`input[name="${radioName}"]:checked`);
            if (checkedRadio) {
                formData[radioName] = checkedRadio.value;
            } else {
                 formData[radioName] = 'pending';
            }
        });

        if (enablePhysicalCheck2) formData.enablePhysicalCheck2 = enablePhysicalCheck2.checked;
        if (enablePhysicalCheck3) formData.enablePhysicalCheck3 = enablePhysicalCheck3.checked;
        if (enablePhysicalCheck4) formData.enablePhysicalCheck4 = enablePhysicalCheck4.checked;
        if (enableAwaAlerts2) formData.enableAwaAlerts2 = enableAwaAlerts2.checked;
        if (transferCheckbox) formData.transferCheckbox = transferCheckbox.checked;
        formData.agentName = _getFieldValue('agentName');
        if (xidInput) formData.xid = xidInput.value;
        if (ticketInput) formData.ticketInput = ticketInput.value;
        if (extraStepsSelect) formData.extraStepsSelect = extraStepsSelect.value;

        try {
            const noteData = {
                finalNoteText: noteToSave,
                formData: formData,
                timestamp: new Date().toISOString()
            };

            if (currentEditingNoteId) {
                const originalNote = await db.notes.get(currentEditingNoteId);
                if (originalNote && originalNote.timestamp) {
                    noteData.timestamp = originalNote.timestamp;
                }
                noteData.id = currentEditingNoteId;
                noteData.isModified = true;
                await db.notes.put(noteData);
                showToast('History note updated.', 'success');
            } else {
                noteData.id = Date.now().toString();
                noteData.isModified = false;
                await db.notes.add(noteData);
                showToast('Note saved to history.', 'success');
            }

            currentEditingNoteId = null;
            isEditingNoteFlag = false;
            await loadNotes();
            _lastNoteIdBeforeModalTransition = null;
            _currentlyViewedNoteData = null; 
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (banInput) {
                banInput.focus();
            }

            return true;
        } catch (e) {
            console.error("Error saving note to IndexedDB:", e);
            showToast('Error saving note to history. Please try again.', 'error');
            return false;
        }
    };

    const loadNotes = async () => {
        if (!noteHistoryList) return;
        noteHistoryList.innerHTML = '';
        
        try {
            _historyNotesCache = await db.notes.orderBy('timestamp').reverse().toArray();
        } catch (e) {
            console.error("Error loading notes from IndexedDB:", e);
            showToast("Error loading note history. The database might be corrupted.", "error");
            _historyNotesCache = [];
        }

        const notes = _historyNotesCache;

        if (notes.length === 0) {
            if (noNotesMessage) {
                noNotesMessage.textContent = 'No saved notes yet.';
                noNotesMessage.style.display = 'block';
            }
            return;
        } else {
            if (noNotesMessage) noNotesMessage.style.display = 'none';
        }

        const notesByDate = {};

        notes.forEach((note) => {
            const timestamp = note.timestamp ? new Date(note.timestamp) : new Date();
            const dateKey = `${timestamp.getUTCFullYear()}-${(timestamp.getUTCMonth() + 1).toString().padStart(2, '0')}-${timestamp.getUTCDate().toString().padStart(2, '0')}`; 

            if (!notesByDate[dateKey]) {
                notesByDate[dateKey] = [];
            }
            notesByDate[dateKey].push(note);
        });

        const sortedDateKeys = Object.keys(notesByDate).sort((a, b) => new Date(b) - new Date(a));

        const today = new Date();
        const todayUTCKey = `${today.getUTCFullYear()}-${(today.getUTCMonth() + 1).toString().padStart(2, '0')}-${today.getUTCDate().toString().padStart(2, '0')}`;


        sortedDateKeys.forEach((dateKey) => {
            const notesForThisDay = notesByDate[dateKey];
            const timestamp = new Date(dateKey);
            const isTodayGroupCheck = (dateKey === todayUTCKey);

            const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][timestamp.getUTCDay()];
            const dayOfMonth = timestamp.getUTCDate();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const month = monthNames[timestamp.getUTCMonth()];
            const year = timestamp.getUTCFullYear();

            let displayDateFormatted = `${dayOfWeek}, ${month} ${dayOfMonth}, ${year}`;

            let groupDisplayDate;
            if (isTodayGroupCheck) {
                groupDisplayDate = 'Today';
            } else {
                groupDisplayDate = displayDateFormatted;
            }

            const currentDayGroup = document.createElement('div');
            currentDayGroup.classList.add('date-group');

            const groupHeader = document.createElement('div');
            groupHeader.classList.add('date-group-header');
            groupHeader.innerHTML = `
                <h3>${groupDisplayDate}</h3>
                <span class="note-count">${notesForThisDay.length}</span>
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="icon-chevron-down">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="icon-chevron-up" style="display:none;">
                    <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
            `;
            currentDayGroup.appendChild(groupHeader);

            const currentDayContentList = document.createElement('ul');
            currentDayContentList.classList.add('date-group-content');
            currentDayGroup.appendChild(currentDayContentList);
            noteHistoryList.appendChild(currentDayGroup);

            if (!isTodayGroupCheck) {
                currentDayContentList.style.maxHeight = '0px';
                currentDayContentList.style.opacity = '0';
                groupHeader.querySelector('.icon-chevron-down').style.display = 'none';
                groupHeader.querySelector('.icon-chevron-up').style.display = 'block';
            } else {
                currentDayContentList.style.opacity = '1';
                groupHeader.querySelector('.icon-chevron-down').style.display = 'block';
                groupHeader.querySelector('.icon-chevron-up').style.display = 'none';
            }

            groupHeader.addEventListener('click', (event) => {
                const content = event.currentTarget.closest('.date-group').querySelector('.date-group-content');
                const iconDown = event.currentTarget.querySelector('.icon-chevron-down');
                const iconUp = event.currentTarget.querySelector('.icon-chevron-up');
                const isCollapsed = content.style.maxHeight === '0px';

                if (isCollapsed) {
                    content.style.maxHeight = 'none';
                    content.offsetHeight;
                    content.style.maxHeight = content.scrollHeight + 'px';
                    content.style.opacity = '1';
                    iconDown.style.display = 'block';
                    iconUp.style.display = 'none';
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    requestAnimationFrame(() => {
                        content.style.maxHeight = '0px';
                        content.style.opacity = '0';
                        iconDown.style.display = 'none';
                        iconUp.style.display = 'block';
                    });
                }
            });

            notesForThisDay.forEach((note) => {
                const ban = note.formData?.ban || '';
                const cid = note.formData?.cid || '';
                const name = note.formData?.name || '';
                const cbr = note.formData?.cbr || '';
                const ticket = note.formData?.ticketInput || '';
                const service = note.formData?.serviceSelect || '';
                const issue = note.formData?.issueSelect || '';
                const resolved = note.formData?.resolvedSelect || '';
                const dispatchDate = note.formData?.dispatchDateInput || '';
                const dispatchTime = note.formData?.dispatchSlotSelect || '';
                const cbr2 = note.formData?.cbr2Input || '';
                const skill = note.formData?.skill || '';
                const noteLength = note.finalNoteText ? note.finalNoteText.length : 0;
                let charCountClasses = 'note-history-char-count';
                if (noteLength > 995) charCountClasses += ' red-text bold-text';
                else if (noteLength > 850) charCountClasses += ' orange-text';


                let additionalDetails = [];
                if (service) additionalDetails.push(`SERVICE: <strong>${service}</strong>`);
                if (issue) additionalDetails.push(`WORKFLOW: <strong>${issue}</strong>`);
                if (resolved) additionalDetails.push(`RESOLVED: <strong>${resolved}</strong>`);

                if (dispatchDate && dispatchTime) {
                    const [year, monthVal, dayVal] = dispatchDate.split('-');
                    const dateObj = new Date(year, monthVal - 1, dayVal);
                    const monthNamesDisp = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    const dayAbbreviations = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const formattedDispatchDate = `${dayAbbreviations[dateObj.getDay()]} ${monthNamesDisp[dateObj.getMonth()]} ${dateObj.getDate()}`;

                    if (resolved === 'No | Tech Booked') {
                        additionalDetails.push(`DISPATCH: <strong>${formattedDispatchDate}, ${dispatchTime}</strong>`);
                    } else if (resolved === 'No | Follow Up Required') {
                        additionalDetails.push(`FOLLOW UP: <strong>${formattedDispatchDate}, ${dispatchTime}</strong>`);
                    }
                }

                if (cbr2) {
                    if (resolved === 'No | BOSR Created') {
                        additionalDetails.push(`BOSR TICKET #: <strong>${cbr2}</strong>`);
                    } else if (resolved === 'No | NC Ticket Created') {
                        additionalDetails.push(`NC TICKET #: <strong>${cbr2}</strong>`);
                    } else if (resolved === 'Cx ask for a Manager | Unable to de escalate. Manager still needed | Escalate to EMT') {
                        additionalDetails.push(`EMT TICKET #: <strong>${cbr2}</strong>`);
                    }
                }

                const isModified = note.isModified ? 'flex' : 'none';
                const listItem = document.createElement('li');
                listItem.classList.add('note-item');
                listItem.dataset.noteId = note.id;
                listItem.dataset.ban = ban;
                listItem.dataset.cid = cid;
                listItem.dataset.name = name;
                listItem.dataset.cbr = cbr;
                listItem.dataset.ticket = ticket;
                listItem.dataset.cbr2 = cbr2;
                listItem.dataset.noteText = note.finalNoteText;

                if (resolved === 'No | Follow Up Required' && dispatchDate && dispatchTime) {
                    listItem.classList.add('note-follow-up-highlight');
                } else if (resolved === 'No | Tech Booked' && dispatchDate && dispatchTime) {
                    listItem.classList.add('note-tech-booked-highlight');
                } else if (resolved === 'No | BOSR Created' && dispatchDate && dispatchTime) {
                    listItem.classList.add('note-bosr-highlight');
                }
                listItem.style.position = 'relative';

                listItem.innerHTML = `
                    <div class="note-item-header">
                        <span class="${charCountClasses}">${noteLength}</span>
                        ${skill ? `<span class="note-skill-label">(${skill})</span>` : ''}
                        <span class="note-modified-indicator" style="display:${isModified};" title="Modified note">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.000 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </span>
                    </div>
                    <div class="note-main-details">
                        <div class="detail-row">
                            <span class="note-meta-label">BAN:</span><span class="note-ban"><strong>${ban}</strong></span>
                        </div>
                        <div class="detail-row">
                            <span class="note-meta-label">CID:</span><span class="note-cid"><strong>${cid}</strong></span>
                        </div>
                        <div class="detail-row">
                            <span class="note-meta-label">NAME:</span><span class="note-name"><strong>${name}</strong></span>
                        </div>
                        <div class="detail-row">
                            <span class="note-meta-label">CBR:</span><span class="note-cbr"><strong>${cbr}</strong></span>
                        </div>
                        ${ticket ? `
                        <div class="detail-row">
                            <span class="note-meta-label">TICKET:</span><span class="note-ticket"><strong>${ticket}</strong></span>
                        </div>` : ''}
                    </div>
                    ${additionalDetails.length > 0 ? `<div class="note-additional-details">${additionalDetails.join('<br>')}</div>` : ''}
                    <div class="note-actions">
                        <button type="button" class="history-action-btn view-btn" data-note-id="${note.id}">VIEW</button>
                        <button type="button" class="history-action-btn edit-btn" data-note-id="${note.id}">EDIT</button>
                        <button type="button" class="history-action-btn delete-btn" data-note-id="${note.id}">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            DELETE
                        </button>
                    </div>
                `;
                currentDayContentList.appendChild(listItem);
            });
        });

        noteHistoryList.querySelectorAll('.date-group').forEach(group => {
            const groupHeader = group.querySelector('.date-group-header h3');
            const groupContent = group.querySelector('.date-group-content');
            const isTodayGroupNow = groupHeader && groupHeader.textContent === 'Today';

            if (isTodayGroupNow && groupContent.style.opacity !== '0') {
                groupContent.style.maxHeight = 'none';
                groupContent.offsetHeight;
                groupContent.style.maxHeight = groupContent.scrollHeight + 'px';
            }
        });

        noteHistoryList.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const noteId = event.target.dataset.noteId;
                const selectedNote = _historyNotesCache.find(n => n.id === noteId);
                if (selectedNote) {
                    hideSidebar();
                    viewNoteInModal(selectedNote);
                } else {
                    showToast('Note not found in history.', 'error');
                }
            });
        });

        noteHistoryList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async (event) => {
                const noteId = event.target.dataset.noteId;
                const selectedNote = _historyNotesCache.find(n => n.id === noteId);
                if (selectedNote) {
                    _lastNoteIdBeforeModalTransition = noteId;
                    closeModal(true);
                    await editNote(selectedNote.formData, selectedNote.id);
                } else {
                    showToast('Note not found for editing.', 'error');
                }
            });
        });

        noteHistoryList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (event) => {
                const noteIdToDelete = event.currentTarget.dataset.noteId;
                unhighlightAllNotes();
                hideSidebar();
                const confirmed = await customConfirm('Are you sure you want to delete this note from history? This action cannot be undone.');
                currentViewedNoteId = null;
                _lastNoteIdBeforeModalTransition = null;
                if (confirmed) {
                    await deleteNote(noteIdToDelete);
                } else {
                    showToast('Deletion canceled.', 'info');
                    showSidebarAndHighlightNote(noteIdToDelete);
                }
            });
        });
        filterNotes(historySearchInput ? historySearchInput.value : '');
    };

    const deleteNote = async (noteId) => {
        try {
            await db.notes.delete(noteId);
            showToast('Note deleted from history.', 'success');
            await loadNotes();
            _lastNoteIdBeforeModalTransition = null;
            _currentlyViewedNoteData = null; 
        } catch (e) {
            console.error("Error deleting note from IndexedDB:", e);
            showToast('Error: Could not delete note.', 'error');
        }
    };
    
    const editNote = async (formData, originalNoteId) => {
        hideSidebar();
        const hasData = checkCurrentFormHasData();
        if (hasData) {
            const confirmed = await customConfirm('There is data in the current editor. Do you want to overwrite it with the data from the selected note?');
            if (!confirmed) {
                showToast('Edit canceled. Current data remains.', 'info');
                showSidebarAndHighlightNote(originalNoteId);
                _lastNoteIdBeforeModalTransition = null;
                return;
            }
        }
        currentEditingNoteId = originalNoteId;
        isEditingNoteFlag = true;
        _currentlyViewedNoteData = null; 
        clearAllFormFields(true);

        for (const key in formData) {
            if (!formData.hasOwnProperty(key)) continue;
            const value = formData[key];
            const element = get(key);

            const radioGroup = document.querySelectorAll(`input[name="${key}"]`);
            if (radioGroup.length > 0) {
                const radioToSelect = document.querySelector(`input[name="${key}"][value="${value}"]`);
                if (radioToSelect) radioToSelect.checked = true;
            } else if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        }

        const checklistItems = checklistSidebar.querySelectorAll('.checklist-item');
        checklistItems.forEach(item => {
            const radioName = item.querySelector('input[type="radio"]').name;
            if (formData[radioName]) {
                const radioToSelect = item.querySelector(`input[value="${formData[radioName]}"]`);
                if (radioToSelect) {
                    radioToSelect.checked = true;
                    const parentItem = radioToSelect.closest('.checklist-item');
                    parentItem.classList.remove('status-pending', 'status-yes', 'status-no', 'status-na');
                    switch (radioToSelect.value) {
                        case 'yes':
                            parentItem.classList.add('status-yes');
                            break;
                        case 'no':
                            parentItem.classList.add('status-no');
                            break;
                        case 'na':
                            parentItem.classList.add('status-na');
                            break;
                        case 'pending':
                            parentItem.classList.add('status-pending');
                            break;
                    }
                } else {
                    const defaultRadio = item.querySelector(`input[value="pending"]`);
                    if(defaultRadio) defaultRadio.checked = true;
                    item.classList.add('status-pending');
                }
            } else {
                 const radios = item.querySelectorAll('input[type="radio"]');
                 radios.forEach(radio => radio.checked = false);
                 item.classList.remove('status-yes', 'status-no', 'status-na', 'checklist-item-required');
                 item.classList.add('status-pending');
            }
        });


        if (banInput) banInput.value = formData.ban || '';
        if (cidInput) cidInput.value = formData.cid || '';
        if (nameInput) nameInput.value = formData.name || '';
        if (cbrInput) cbrInput.value = formData.cbr || '';
        if (addressInput) addressInput.value = formData.address || '';
        if (csrOrderInput) csrOrderInput.value = formData.csrOrderInput || '';

        if (formData.skill) {
            skillToggle.checked = formData.skill === 'SHS';
            handleSkillChange();
        }

        if (serviceSelect) {
            serviceSelect.value = formData.serviceSelect || '';
            serviceSelect.disabled = (formData.skill === 'SHS');
            populateIssueSelect(formData.serviceSelect, formData.issueSelect);
            updateAffectedFieldVisibilityAndLabel(formData.serviceSelect, formData.affectedText);
            _populatePhysicalCheckListLabelsAndOptions(
                formData.serviceSelect,
                formData.physicalCheckList1Select,
                formData.physicalCheckList2Select,
                formData.physicalCheckList3Select,
                formData.physicalCheckList4Select,
                formData.issueSelect
            );
            _updatePhysicalCheckListEnablement(
                formData.serviceSelect,
                formData.enablePhysicalCheck2,
                formData.enablePhysicalCheck3,
                formData.enablePhysicalCheck4
            );
            updateOptikTvLegacySpecificFields(
                formData.serviceSelect,
                formData.xVuStatusSelect,
                formData.packetLossSelect
            );
        }

        if (awaAlertsSelect) awaAlertsSelect.value = formData.awaAlertsSelect || '';

        updateAwaAlerts2SelectState(formData.enableAwaAlerts2, formData.awaAlerts2Select);
        updateAwaStepsSelectState(formData.awaStepsSelect);

        updateTvsKeyFieldState(formData.tvsSelect, formData.tvsKeyInput);
        updateTransferFieldState(formData.transferCheckbox, formData.transferSelect);
        updateTechFieldsVisibilityAndState(formData.resolvedSelect, formData.cbr2Input, formData.aocInput, formData.dispatchDateInput, formData.dispatchTimeSlotSelect);
        updateThirdRowLayout(formData.caller, formData.xid);

        if (get('serviceOnCsr')) get('serviceOnCsr').value = formData.serviceOnCsr || '';
        if (get('extraStepsSelect')) get('extraStepsSelect').value = formData.extraStepsSelect || '';
        if (get('ticketInput')) get('ticketInput').value = formData.ticketInput || '';

        await new Promise(resolve => setTimeout(resolve, 10));
        applyInitialRequiredHighlight();
        generateFinalNote();
        showToast('Note loaded into the editor.', 'success');
        _lastNoteIdBeforeModalTransition = null;
    };

    const clearAllFormFields = (isForEdit = false) => {
        const form = document.getElementById('callNoteForm');
        if (!form) return;
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.tagName === 'BUTTON' || element.tagName === 'FIELDSET' || (!element.id && !element.name)) continue;
            if (element.id === 'agentName' && agentNameInput && agentNameInput.readOnly) continue;

            element.classList.remove('required-initial-border');
            element.style.border = '';

            if (isForEdit) {
                if (element.tagName === 'SELECT') {
                    element.disabled = false;
                }
            } else {
                element.removeAttribute('required');
                element.removeAttribute('readonly');
                if (element.type === 'checkbox') element.checked = false;
                else if (element.type === 'radio') element.checked = false;
                else if (element.tagName === 'SELECT' || element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') element.value = '';
                if (element.tagName === 'SELECT') element.disabled = false;
            }
        }

        resetChecklist();

        document.querySelectorAll('.checklist-section').forEach(section => {
            const title = section.querySelector('.checklist-section-title');
            const container = section.querySelector('.checklist-items-container');
            if (title) title.classList.remove('collapsed');
            if (container) {
                container.classList.remove('collapsed');
                container.style.maxHeight = '1000px';
                container.style.opacity = '1';
                const iconDown = section.querySelector('.icon-chevron-down');
                const iconUp = section.querySelector('.icon-chevron-up');
                if (iconDown) iconDown.style.display = 'block';
                if (iconUp) iconUp.style.display = 'none';
            }
        });

        if (!isForEdit && skillToggle) skillToggle.checked = false;
        if (xidFieldContainer) xidFieldContainer.classList.add('hidden-field');
        if (affectedTextGroup) affectedTextGroup.style.display = 'none';
        if (serviceAffectedRow) serviceAffectedRow.classList.remove('has-affected');
        if (optikTvLegacySpecificFieldsContainer) optikTvLegacySpecificFieldsContainer.style.display = 'none';
        if (awaAlerts2Select) awaAlerts2Select.disabled = true;
        if (awaStepsSelect) awaStepsSelect.disabled = true;

        if (activeDevicesGroup) activeDevicesGroup.style.display = 'none';
        if (totalDevicesGroup) totalDevicesGroup.style.display = 'none';
        if (downloadBeforeGroup) downloadBeforeGroup.style.display = 'none';
        if (uploadBeforeGroup) uploadBeforeGroup.style.display = 'none';
        if (downloadAfterGroup) downloadAfterGroup.style.display = 'none';
        if (uploadAfterGroup) uploadAfterGroup.style.display = 'none';

        if (!isForEdit) {
            if (activeDevicesInput) activeDevicesInput.value = '';
            if (totalDevicesInput) totalDevicesInput.value = '';
            if (downloadBeforeInput) downloadBeforeInput.value = '';
            if (uploadBeforeInput) uploadBeforeInput.value = '';
            if (downloadAfterInput) downloadAfterInput.value = '';
            if (uploadAfterInput) uploadAfterInput.value = '';
        }

        updateTvsKeyFieldState();
        if (transferCheckbox) transferCheckbox.checked = false;
        updateTransferFieldState();
        updateTechFieldsVisibilityAndState('');
        populateTimeSlots("dispatch");
        sections.forEach(section => section.classList.remove('collapsed'));
        if (troubleshootingProcessText) updateTroubleshootingCharCounter(0);
        updateCharCounter(0, modalNoteCharCount, CHARACTER_LIMIT, false, true);
        updateCharCounter(0, mainNoteCharCountHeader, CHARACTER_LIMIT, false, true);
        generateFinalNote();
        if (!isForEdit) {
            currentEditingNoteId = null;
            isEditingNoteFlag = false;
            _currentlyViewedNoteData = null; 
        }
        applyInitialRequiredHighlight();
        handleSkillChange();
    };

    const checkCurrentFormHasData = () => {
        const form = document.getElementById('callNoteForm');
        if (!form) return false;
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (!element.id && !element.name) continue;
            const containerElement = element.closest('.input-group') || element.closest('.radio-group');
            const isHiddenOrDisabled = (containerElement && (containerElement.style.display === 'none' || containerElement.classList.contains('hidden-field'))) || element.disabled;
            if (element.id === 'agentName' && agentNameInput && agentNameInput.readOnly) continue;

            const currentSkill = skillToggle.checked ? 'SHS' : 'FFH';
            const isSpeedOrDeviceField = ['activeDevicesInput', 'totalDevicesInput', 'downloadBeforeInput', 'uploadBeforeInput', 'downloadAfterInput', 'uploadAfterInput'].includes(element.id);
            if (isSpeedOrDeviceField && currentSkill === 'SHS') {
                continue;
            }

            if (isHiddenOrDisabled) continue;
            if (element.tagName === 'INPUT') {
                if (element.type === 'radio') {
                    const radioGroupName = element.name;
                    if (radioGroupName) {
                        const checkedRadio = document.querySelector(`input[name="${radioGroupName}"]:checked`);
                        if (checkedRadio) {
                            if (['outage', 'errorsInNC', 'accountSuspended'].includes(radioGroupName) && checkedRadio.value !== 'no') {
                                return true;
                            } else if (!['outage', 'errorsInNC', 'accountSuspended'].includes(radioGroupName)) {
                                return true;
                            }
                        }
                    }
                } else if (element.type === 'checkbox') {
                    if (element.id !== 'skillToggle' && element.checked) return true;
                } else if (element.value.trim() !== '') {
                    return true;
                }
            } else if (element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
                if (element.value.trim() !== '') {
                    return true;
                }
            }
        }
        return false;
    };
    
    // =================================================================================
    // 4. UI AND HELPER FUNCTIONS
    // =================================================================================
    
    const autoResizeTextarea = (element) => {
        if (!element || element.id === 'modalNoteTextarea') return;
        element.style.height = 'auto';
        const computedStyle = window.getComputedStyle(element);
        const minHeightPx = parseFloat(computedStyle.minHeight);
        const maxHeightPx = parseFloat(computedStyle.maxHeight);
        let targetHeight = element.scrollHeight;
        if (targetHeight < minHeightPx) {
            targetHeight = minHeightPx;
        } else if (targetHeight > maxHeightPx) {
            targetHeight = maxHeightPx;
            element.style.overflowY = 'auto';
        } else {
            element.style.overflowY = 'hidden';
        }
        element.style.height = targetHeight + 'px';
    };

    function showToast(message, type = 'info', duration = 3000) {
        if (!toastContainer) {
            console.error('Toast container not found!');
            return;
        }
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        toast.offsetHeight;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, { once: true });
        }, duration);
    }

    async function copyToClipboard(textToCopy) {
        if (typeof textToCopy !== 'string' || textToCopy.trim() === '') {
            showToast('Empty field. Nothing to copy.', 'error');
            return false;
        }

        try {
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = textToCopy;
            tempTextArea.style.position = 'absolute';
            tempTextArea.style.left = '-9999px';
            document.body.appendChild(tempTextArea);

            tempTextArea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextArea);

            showToast(`Text copied to clipboard.`, 'success');
            return true;
        } catch (err) {
            console.error('Error copying to clipboard:', err);
            showToast('Could not copy text.', 'error');
            return false;
        }
    };

    function customConfirm(message) {
        if (!confirmMessage || !customConfirmModal) return Promise.resolve(false);
        confirmMessage.textContent = message;
        customConfirmModal.style.display = 'flex';
        return new Promise((resolve) => {
            resolveConfirmPromise = resolve;
        });
    };

    const updateCharCounter = (currentCount, counterElement, maxLength, isDescendingMode = false, applyColors = false) => {
        if (!counterElement) return;
        let displayCount = isDescendingMode ? maxLength - currentCount : currentCount;
        counterElement.textContent = displayCount;
        if (applyColors) {
            counterElement.classList.remove('red-text', 'orange-text', 'bold-text');
            const WARNING_CHARS_THRESHOLD = 850;
            const DANGER_CHARS_THRESHOLD = 995;
            if (currentCount > DANGER_CHARS_THRESHOLD) {
                counterElement.classList.add('red-text', 'bold-text');
            } else if (currentCount > WARNING_CHARS_THRESHOLD) {
                counterElement.classList.add('orange-text');
            }
        }
    };

    const updateTroubleshootingCharCounter = (currentCount) => {
        if (!troubleshootingCharCountSpan) return;
        troubleshootingCharCountSpan.textContent = currentCount;
        troubleshootingCharCountSpan.classList.remove('orange-text', 'red-text', 'bold-text');
        if (currentCount > TS_CHAR_RED_THRESHOLD) {
            troubleshootingCharCountSpan.classList.add('red-text', 'bold-text');
        } else if (currentCount > TS_CHAR_ORANGE_THRESHOLD) {
            troubleshootingCharCountSpan.classList.add('orange-text', 'bold-text');
        }
    };

    const updateSeparatePartCharCounter = (textareaElement, counterElement) => {
        if (!textareaElement || !counterElement) return;
        const currentCount = textareaElement.value.length;
        counterElement.textContent = currentCount;
        counterElement.classList.remove('red-text', 'orange-text', 'bold-text');
        const WARNING_CHARS_THRESHOLD_SEPARATE = 850;
        const DANGER_CHARS_THRESHOLD_SEPARATE = 995;
        if (currentCount > DANGER_CHARS_THRESHOLD_SEPARATE) {
            counterElement.classList.add('red-text', 'bold-text');
        } else if (currentCount > WARNING_CHARS_THRESHOLD_SEPARATE) {
            counterElement.classList.add('orange-text');
        }
    };

    const setAgentNameReadonly = () => {
        if (agentNameInput) {
            agentNameInput.setAttribute('readonly', 'readonly');
            agentNameInput.style.backgroundColor = '#f0f0f0';
            agentNameInput.style.cursor = 'not-allowed';
            agentNameInput.title = 'This field can only be edited by pressing the edit button.';
            agentNameInput.removeEventListener('blur', saveAgentNameOnBlur);
            agentNameInput.removeEventListener('keydown', saveAgentNameOnEnter);
            isAgentNameEditable = false;
            agentNameInput.classList.remove('required-initial-border');
        }
    };

    const setAgentNameEditable = () => {
        if (agentNameInput) {
            agentNameInput.removeAttribute('readonly');
            agentNameInput.style.backgroundColor = '';
            agentNameInput.style.cursor = 'text';
            agentNameInput.title = 'Edit your name. It will be saved on blur or by pressing Enter.';
            agentNameInput.focus();
            agentNameInput.select();
            agentNameInput.addEventListener('blur', saveAgentNameOnBlur);
            agentNameInput.addEventListener('keydown', saveAgentNameOnEnter);
            isAgentNameEditable = true;
            if (!_getFieldValue('agentName')) {
                agentNameInput.classList.add('required-initial-border');
            }
        }
    };

    const loadAgentName = async () => {
        try {
            const agentNameSetting = await db.settings.get(AGENT_NAME_KEY);
            if (agentNameSetting && agentNameSetting.value) {
                if (agentNameInput) agentNameInput.value = agentNameSetting.value;
                setAgentNameReadonly();
            } else {
                setAgentNameEditable();
                if (agentNameInput && !_getFieldValue('agentName')) {
                    agentNameInput.classList.add('required-initial-border');
                }
            }
        } catch (e) {
            console.error("Error loading agent name from IndexedDB:", e);
            showToast('Could not load agent name.', 'error');
            setAgentNameEditable();
        }
        generateFinalNote();
    };

    const saveAgentName = async () => {
        const name = _getFieldValue('agentName');
        if (name) {
            try {
                await db.settings.put({ key: AGENT_NAME_KEY, value: name });
                setAgentNameReadonly();
                showToast('Agent name saved.', 'success');
            }
            catch (e) {
                console.error("Error saving agent name to IndexedDB:", e);
                showToast('Error saving agent name.', 'error');
            }
        } else {
            if (agentNameInput) agentNameInput.classList.add('required-initial-border');
            showToast('Agent name cannot be empty.', 'error');
        }
        generateFinalNote();
    };
    
    const updateThirdRowLayout = (callerValue = null, xidValue = '') => {
        if (!callerSelect || !xidFieldContainer || !xidInput) {
            console.error("Some elements from Section 1 were not found. Could not update layout.");
            return;
        }

        const currentCallerValue = callerValue === null ? _getFieldValue('caller') : callerValue;

        if (currentCallerValue === 'Consultation') {
            xidFieldContainer.classList.remove('hidden-field');
            xidInput.setAttribute('required', 'required');
            if (isEditingNoteFlag) {
                xidInput.value = xidValue;
            }
        } else {
            xidFieldContainer.classList.add('hidden-field');
            xidInput.removeAttribute('required');
            if (!isEditingNoteFlag) {
                xidInput.value = '';
            }
        }

        applyInitialRequiredHighlight();
        generateFinalNote();
    };

    const populateIssueSelect = (service, selectedIssue = '') => {
        if (!issueSelect) return;
        issueSelect.innerHTML = '<option value="">Select an issue</option>';
        issueSelect.setAttribute('required', service ? 'required' : '');
        if (service && issueOptions[service]) {
            issueOptions[service].forEach(issue => {
                const option = document.createElement('option');
                option.value = issue;
                option.textContent = issue;
                issueSelect.appendChild(option);
            });
            issueSelect.disabled = false;
            if (selectedIssue && Array.from(issueSelect.options).some(option => option.value === selectedIssue)) {
                issueSelect.value = selectedIssue;
            } else if (selectedIssue) {
                issueSelect.value = '';
            } else {
                issueSelect.value = '';
            }
        } else {
            issueSelect.disabled = true;
            issueSelect.value = '';
        }
    };

    const updateAffectedFieldVisibilityAndLabel = (service, affectedTextValue = '') => {
        if (!affectedLabel || !affectedText || !affectedTextGroup || !serviceAffectedRow) return;
        let affectedLabelText = 'AFFECTED';
        let isVisible = false;
        serviceAffectedRow.classList.remove('has-affected');
        if (service === 'HomePhone / Fiber' || service === 'HomePhone / Copper') {
            affectedLabelText = 'AFFECTED PHONE NUMBER';
            isVisible = true;
        } else if (service === 'Telus Email') {
            affectedLabelText = 'TELUS EMAIL';
            isVisible = true;
        } else if (service === 'MyTelus') {
            affectedLabelText = 'MYTELUS EMAIL';
            isVisible = true;
        }
        affectedLabel.textContent = affectedLabelText;
        if (isVisible) {
            affectedTextGroup.style.display = 'flex';
            affectedText.setAttribute('required', 'required');
            if (isEditingNoteFlag) affectedText.value = affectedTextValue;
            serviceAffectedRow.classList.add('has-affected');
        } else {
            affectedTextGroup.style.display = 'none';
            affectedText.removeAttribute('required');
            if (!isEditingNoteFlag) affectedText.value = '';
        }
        applyInitialRequiredHighlight();
        generateFinalNote();
    };

    const _populatePhysicalCheckListLabelsAndOptions = (service, phys1Value = '', phys2Value = '', phys3Value = '', phys4Value = '', selectedIssueFromForm = '') => {
        const listsData = [
            { select: physicalCheckList1Select, labelEl: physicalCheckList1Label, key: 'list1', formDataValue: phys1Value },
            { select: physicalCheckList2Select, labelEl: physicalCheckList2Label, key: 'list2', formDataValue: phys2Value },
            { select: physicalCheckList3Select, labelEl: physicalCheckList3Label, key: 'list3', formDataValue: phys3Value },
            { select: physicalCheckList4Select, labelEl: physicalCheckList4Label, key: 'list4', formDataValue: phys4Value }
        ];

        const currentSkill = skillToggle.checked ? 'SHS' : 'FFH';
        const isSHS = currentSkill === 'SHS';
        const currentIssueValue = _getFieldValue('issueSelect');

        listsData.forEach(item => {
            const select = item.select;
            const labelEl = item.labelEl;
            const listKey = item.key;
            const formDataValue = item.formDataValue;

            if (!select || !labelEl) return;

            if (isSHS) {
                if (select.id === 'physicalCheckList1Select') {
                    labelEl.textContent = 'IQ PANEL';
                } else if (select.id === 'physicalCheckList2Select') {
                    labelEl.textContent = 'DEVICE';
                } else if (select.id === 'physicalCheckList3Select') {
                    labelEl.textContent = 'CONDITION';
                } else if (select.id === 'physicalCheckList4Select') {
                    labelEl.textContent = 'XYZ';
                } else {
                    labelEl.textContent = fieldConfig[select.id].label;
                }
            } else {
                const customLabel = physicalCheckLabels[service]?.[listKey];
                labelEl.textContent = customLabel || fieldConfig[select.id].label;
            }

            if (select.id === 'physicalCheckList2Select' && isSHS) {
                const effectiveIssue = selectedIssueFromForm || currentIssueValue;
                select.innerHTML = '<option value="">Select an option</option>';

                if (shsIssuesToDisableDevice.includes(effectiveIssue)) {
                    select.disabled = true;
                    select.removeAttribute('required');
                    select.value = '';
                } else if (shsDeviceOptionsMap[effectiveIssue] || effectiveIssue === 'General Issues') {
                    const optionsSource = effectiveIssue === 'General Issues' ? shsDeviceOptionsMap['Main Panel'] : shsDeviceOptionsMap[effectiveIssue];
                    optionsSource.forEach(optionText => {
                        const option = document.createElement('option');
                        option.value = optionText;
                        option.textContent = optionText;
                        select.appendChild(option);
                    });
                    select.disabled = false;
                    select.setAttribute('required', 'required');
                } else if (directIssueToDeviceMap.includes(effectiveIssue)) {
                    const option = document.createElement('option');
                    option.value = effectiveIssue;
                    option.textContent = effectiveIssue;
                    select.appendChild(option);
                    select.disabled = false;
                    select.setAttribute('required', 'required');
                } else {
                    select.disabled = true;
                    select.removeAttribute('required');
                    select.value = '';
                }

                if (formDataValue && Array.from(select.options).some(option => option.value === formDataValue)) {
                    select.value = formDataValue;
                } else {
                    if (select.value === "") {
                        select.value = '';
                    }
                }
            } else if (select.id === 'physicalCheckList3Select' && isSHS) {
                select.innerHTML = '<option value="">Select an option</option>';
                const conditionOptions = ['Device OK', 'Low Battery', 'Not Responding', 'Malfunction', 'IDLE', 'Tamper', 'Bypassed', 'Not Connected to Wi-Fi', ];
                conditionOptions.forEach(optionText => {
                    const option = document.createElement('option');
                    option.value = optionText;
                    option.textContent = optionText;
                    select.appendChild(option);
                });
                select.disabled = false;
                select.setAttribute('required', 'required');
                if (formDataValue && Array.from(select.options).some(option => option.value === formDataValue)) {
                    select.value = formDataValue;
                } else {
                    select.value = '';
                }
            } else {
                select.innerHTML = '<option value="">Select an option</option>';
                const options = (service && equipmentOptions[service] && equipmentOptions[service][listKey]) ? equipmentOptions[service][listKey] : [];
                options.forEach(optionText => {
                    const option = document.createElement('option');
                    option.value = optionText;
                    option.textContent = optionText;
                    select.appendChild(option);
                });
                if (formDataValue && Array.from(select.options).some(option => option.value === formDataValue)) {
                    select.value = formDataValue;
                } else {
                    select.value = '';
                }
            }
        });
    };

    const _updatePhysicalCheckListEnablement = (service, isPhys2CheckedFromFormData = null, isPhys3CheckedFromFormData = null, isPhys4CheckedFromFormData = null) => {
        const listsData = [
            { select: physicalCheckList1Select, checkbox: null, formDataChecked: null },
            { select: physicalCheckList2Select, checkbox: enablePhysicalCheck2, formDataChecked: isPhys2CheckedFromFormData },
            { select: physicalCheckList3Select, checkbox: enablePhysicalCheck3, formDataChecked: isPhys3CheckedFromFormData },
            { select: physicalCheckList4Select, checkbox: enablePhysicalCheck4, formDataChecked: isPhys4CheckedFromFormData }
        ];
        if (!physicalCheckListsContainer) return;
        const currentSkill = skillToggle.checked ? 'SHS' : 'FFH';
        const isSHS = currentSkill === 'SHS';
        const isServiceSelected = service && service !== '';

        if (!isServiceSelected && !isEditingNoteFlag) {
            physicalCheckListsContainer.classList.add('hidden-field');
            listsData.forEach(item => {
                const select = item.select;
                const checkbox = item.checkbox;
                if (select) {
                    select.value = '';
                    select.disabled = true;
                    select.removeAttribute('required');
                }
                if (checkbox) {
                    checkbox.checked = false;
                    checkbox.disabled = true;
                }
            });
        } else if (isSHS) {
            physicalCheckListsContainer.classList.remove('hidden-field');
            listsData.forEach(item => {
                const select = item.select;
                const checkbox = item.checkbox;
                if (!select) return;
                if (checkbox === null) {
                    select.disabled = false;
                    select.setAttribute('required', 'required');
                } else {
                    checkbox.disabled = false;
                    const effectiveCheckedState = isEditingNoteFlag ? item.formDataChecked : checkbox.checked;
                    checkbox.checked = effectiveCheckedState;
                    if (effectiveCheckedState) {
                        select.disabled = false;
                        select.setAttribute('required', 'required');
                    } else {
                        select.disabled = true;
                        if (!isEditingNoteFlag || (isEditingNoteFlag && item.formDataChecked === false)) {
                            select.value = '';
                        }
                        select.removeAttribute('required');
                    }
                }
            });
        } else {
            const shouldHidePhysicalCheckForFFHService = SERVICES_TO_HIDE_PHYSICAL_CHECK.includes(service);
            if (shouldHidePhysicalCheckForFFHService) {
                physicalCheckListsContainer.classList.add('hidden-field');
                listsData.forEach(item => {
                    const select = item.select;
                    const checkbox = item.checkbox;
                    if (select) {
                        select.value = '';
                        select.disabled = true;
                        select.removeAttribute('required');
                    }
                    if (checkbox) {
                        checkbox.checked = false;
                        checkbox.disabled = true;
                    }
                });
            } else {
                physicalCheckListsContainer.classList.remove('hidden-field');
                listsData.forEach(item => {
                    const select = item.select;
                    const checkbox = item.checkbox;
                    if (!select) return;
                    if (checkbox === null) {
                        select.disabled = false;
                        select.setAttribute('required', 'required');
                    } else {
                        checkbox.disabled = false;
                        const effectiveCheckedState = isEditingNoteFlag ? item.formDataChecked : checkbox.checked;
                        checkbox.checked = effectiveCheckedState;
                        if (effectiveCheckedState) {
                            select.disabled = false;
                            select.setAttribute('required', 'required');
                        } else {
                            select.disabled = true;
                            if (!isEditingNoteFlag || (isEditingNoteFlag && item.formDataChecked === false)) {
                                select.value = '';
                            }
                            select.removeAttribute('required');
                        }
                    }
                });
            }
        }
        applyInitialRequiredHighlight();
        generateFinalNote();
    };

    const updateOptikTvLegacySpecificFields = (service, xVuValue = '', packetLossValue = '') => {
        if (!optikTvLegacySpecificFieldsContainer || !xVuStatusSelect || !packetLossSelect) return;
        if (service === 'Optik TV (Legacy)') {
            optikTvLegacySpecificFieldsContainer.style.display = 'flex';
            xVuStatusSelect.innerHTML = '<option value="">Select an option</option>';
            const xVuOptions = (equipmentOptions[service] && equipmentOptions[service].list5) ? equipmentOptions[service].list5 : [];
            xVuOptions.forEach(optionText => {
                const option = document.createElement('option');
                option.value = optionText;
                option.textContent = optionText;
                xVuStatusSelect.appendChild(option);
            });
            xVuStatusSelect.disabled = false;
            xVuStatusSelect.setAttribute('required', 'required');
            if (xVuValue && Array.from(xVuStatusSelect.options).some(option => option.value === xVuValue)) {
                xVuStatusSelect.value = xVuValue;
            } else if (xVuValue) {
                xVuStatusSelect.value = '';
            } else {
                xVuStatusSelect.value = '';
            }
            packetLossSelect.innerHTML = '<option value="">Select an option</option>';
            const packetLossOptions = (equipmentOptions[service] && equipmentOptions[service].list6) ? equipmentOptions[service].list6 : [];
            packetLossOptions.forEach(optionText => {
                const option = document.createElement('option');
                option.value = optionText;
                option.textContent = optionText;
                packetLossSelect.appendChild(option);
            });
            packetLossSelect.disabled = false;
            packetLossSelect.setAttribute('required', 'required');
            if (packetLossValue && Array.from(packetLossSelect.options).some(option => option.value === packetLossValue)) {
                packetLossSelect.value = packetLossValue;
            } else if (packetLossValue) {
                packetLossSelect.value = '';
            } else {
                packetLossSelect.value = '';
            }
        } else {
            optikTvLegacySpecificFieldsContainer.style.display = 'none';
            xVuStatusSelect.value = '';
            xVuStatusSelect.disabled = true;
            xVuStatusSelect.removeAttribute('required');
            packetLossSelect.value = '';
            packetLossSelect.disabled = true;
            packetLossSelect.removeAttribute('required');
        }
        applyInitialRequiredHighlight();
        generateFinalNote();
    };

    const _populateAwaAlertsOptions = (skill, selectedValue = '') => {
        if (!awaAlertsSelect || !awaAlertsSelectLabel) return;
        const options = skill === 'SHS' ? awaAlertsOptionsSHS : awaAlertsOptionsFFH;
        awaAlertsSelectLabel.textContent = skill === 'SHS' ? 'ADC TROUBLE CONDITIONS' : 'AWA ALERTS';
        awaAlertsSelect.innerHTML = '<option value="">Select an option</option>';
        options.forEach(optionText => {
            const option = document.createElement('option');
            option.value = optionText;
            option.textContent = optionText;
            awaAlertsSelect.appendChild(option);
        });
        if (selectedValue && Array.from(awaAlertsSelect.options).some(option => option.value === selectedValue)) {
            awaAlertsSelect.value = selectedValue;
        } else {
            awaAlertsSelect.value = '';
        }
        awaAlertsSelect.disabled = false;
        awaAlertsSelect.setAttribute('required', 'required');
    };

    const updateAwaAlerts2SelectState = (isAwa2CheckedFromFormData = null, awa2Value = '') => {
        if (!enableAwaAlerts2 || !awaAlerts2Select || !awaAlerts2SelectLabel) return;
        const currentSkill = skillToggle.checked ? 'SHS' : 'FFH';
        const options = currentSkill === 'SHS' ? awaAlerts2OptionsSHS : awaAlerts2OptionsFFH;
        awaAlerts2SelectLabel.textContent = currentSkill === 'SHS' ? 'ADC TROUBLE CONDITIONS 2' : 'AWA ALERTS 2';
        awaAlerts2Select.innerHTML = '<option value="">Select an option</option>';
        options.forEach(optionText => {
            const option = document.createElement('option');
            option.value = optionText;
            option.textContent = optionText;
            awaAlerts2Select.appendChild(option);
        });

        const effectiveCheckedState = isEditingNoteFlag ? isAwa2CheckedFromFormData : enableAwaAlerts2.checked;
        enableAwaAlerts2.checked = effectiveCheckedState;
        if (effectiveCheckedState) {
            awaAlerts2Select.disabled = false;
            if (awa2Value && Array.from(awaAlerts2Select.options).some(option => option.value === awa2Value)) {
                awaAlerts2Select.value = awa2Value;
            } else if (awa2Value) {
                awaAlerts2Select.value = '';
            }
        } else {
            awaAlerts2Select.disabled = true;
            awaAlerts2Select.value = '';
        }
        applyInitialRequiredHighlight();
        generateFinalNote();
    };

    const updateAwaStepsSelectState = (awaStepsValue = '') => {
        if (!awaAlertsSelect || !awaStepsSelect || !awaStepsSelectLabel) return;
        const currentSkill = skillToggle.checked ? 'SHS' : 'FFH';
        const options = currentSkill === 'SHS' ? awaStepsOptionsSHS : awaStepsOptionsFFH;
        awaStepsSelectLabel.textContent = currentSkill === 'SHS' ? 'ADC TROUBLE CONDITIONS 3' : 'AWA STEPS';
        awaStepsSelect.innerHTML = '<option value="">Select an option</option>';
        options.forEach(optionText => {
            const option = document.createElement('option');
            option.value = optionText;
            option.textContent = optionText;
            awaStepsSelect.appendChild(option);
        });

        const isAwaAlertsMainSelected = _getFieldValue('awaAlertsSelect') !== '';
        if (isAwaAlertsMainSelected) {
            awaStepsSelect.disabled = false;
            awaStepsSelect.setAttribute('required', 'required');
            if (awaStepsValue && Array.from(awaStepsSelect.options).some(option => option.value === awaStepsValue)) {
                awaStepsSelect.value = awaStepsValue;
            } else if (awaStepsValue) {
                awaStepsSelect.value = '';
            }
        } else {
            awaStepsSelect.disabled = true;
            awaStepsSelect.value = '';
            awaStepsSelect.removeAttribute('required');
        }
        applyInitialRequiredHighlight();
        generateFinalNote();
    };

    const updateTvsKeyFieldState = (tvsValue = '', tvsKeyValue = '') => {
        if (!tvsSelect || !tvsKeyFieldContainer || !tvsKeyInput) return;
        const currentTvsSelectValue = isEditingNoteFlag ? tvsValue : _getFieldValue('tvsSelect');
        if (currentTvsSelectValue === 'YES') {
            tvsKeyFieldContainer.style.display = 'flex';
            tvsKeyInput.setAttribute('required', 'required');
            if (isEditingNoteFlag) tvsKeyInput.value = tvsKeyValue;
        } else {
            tvsKeyFieldContainer.style.display = 'none';
            if (!isEditingNoteFlag) tvsKeyInput.value = '';
            tvsKeyInput.removeAttribute('required');
        }
        applyInitialRequiredHighlight();
        generateFinalNote();
    };

    const updateTransferFieldState = (isTransferCheckedFromFormData = null, transferValue = '') => {
        if (!transferCheckbox || !transferSelect) return;
        const effectiveCheckedState = isEditingNoteFlag ? isTransferCheckedFromFormData : transferCheckbox.checked;
        transferCheckbox.checked = effectiveCheckedState;
        if (effectiveCheckedState) {
            transferSelect.disabled = false;
            transferSelect.setAttribute('required', 'required');
            if (transferValue && Array.from(transferSelect.options).some(option => option.value === transferValue)) {
                transferSelect.value = transferValue;
            } else if (transferValue) {
                transferSelect.value = '';
            }
        } else {
            transferSelect.disabled = true;
            transferSelect.value = '';
            transferSelect.removeAttribute('required');
        }
        applyInitialRequiredHighlight();
        generateFinalNote();
    };

    const updateTechFieldsVisibilityAndState = (resolvedValue, cbr2Value = '', aocValue = '', dispatchDateValue = '', dispatchTimeValue = '') => {
        const allDynamicTechFields = [
            { container: cbr2FieldContainer, element: cbr2Input, labelEl: cbr2Label, originalLabel: 'CBR2', requiredIfVisible: true, formDataValue: cbr2Value },
            { container: aocFieldContainer, element: aocInput, labelEl: null, originalLabel: 'AOC', requiredIfVisible: false, formDataValue: aocValue },
            { container: dispatchDateInputContainer, element: dispatchDateInput, labelEl: dispatchDateLabel, originalLabel: 'DISPATCH DATE', requiredIfVisible: true, formDataValue: dispatchDateValue },
            { container: dispatchTimeSlotSelectContainer, element: dispatchTimeSlotSelect, labelEl: dispatchTimeLabel, originalLabel: 'DISPATCH TIME', requiredIfVisible: true, formDataValue: dispatchTimeValue }
        ];

        allDynamicTechFields.forEach(field => {
            if (field.container) field.container.style.display = 'none';
            if (field.element) {
                field.element.removeAttribute('required');
                field.element.removeAttribute('readonly');
                field.element.classList.remove('required-initial-border');
                if (field.element.tagName === 'SELECT') field.element.disabled = true;
                if (!isEditingNoteFlag) field.element.value = '';
            }
            if (field.labelEl) field.labelEl.textContent = field.originalLabel;
        });

        if (resolvedValue === 'No | Tech Booked') {
            if (cbr2FieldContainer) cbr2FieldContainer.style.display = 'flex';
            if (aocFieldContainer) aocFieldContainer.style.display = 'flex';
            if (dispatchDateInputContainer) dispatchDateInputContainer.style.display = 'flex';
            if (dispatchTimeSlotSelectContainer) dispatchTimeSlotSelectContainer.style.display = 'flex';
            if (cbr2Input) {
                cbr2Input.setAttribute('required', 'required');
                if (isEditingNoteFlag) cbr2Input.value = cbr2Value;
            }
            if (cbr2Label) cbr2Label.textContent = 'CBR2';
            if (aocInput) {
                if (isEditingNoteFlag) aocInput.value = aocValue;
                else aocInput.value = fieldConfig.aocInput.defaultValue;
                aocInput.setAttribute('readonly', 'readonly');
            }
            if (dispatchDateInput) {
                dispatchDateInput.setAttribute('required', 'required');
                if (isEditingNoteFlag) dispatchDateInput.value = dispatchDateValue;
            }
            if (dispatchDateLabel) dispatchDateLabel.textContent = 'DISPATCH DATE';
            if (dispatchTimeSlotSelect) {
                dispatchTimeSlotSelect.setAttribute('required', 'required');
                dispatchTimeSlotSelect.disabled = false;
                if (isEditingNoteFlag && dispatchTimeValue) {
                    populateTimeSlots("dispatch", dispatchTimeValue);
                } else {
                    populateTimeSlots("dispatch");
                }
            }
        } else if (resolvedValue === 'No | Follow Up Required' || resolvedValue === 'No | Follow Up Required | Set SCB with FVA') {
            if (dispatchDateInputContainer) dispatchDateInputContainer.style.display = 'flex';
            if (dispatchTimeSlotSelectContainer) dispatchTimeSlotSelectContainer.style.display = 'flex';
            if (dispatchDateInput) {
                dispatchDateInput.setAttribute('required', 'required');
                if (isEditingNoteFlag) dispatchDateInput.value = dispatchDateValue;
            }
            if (dispatchDateLabel) dispatchDateLabel.textContent = 'FOLLOW UP DATE';
            if (dispatchTimeSlotSelect) {
                dispatchTimeSlotSelect.setAttribute('required', 'required');
                dispatchTimeSlotSelect.disabled = false;
                if (isEditingNoteFlag && dispatchTimeValue) {
                    populateTimeSlots("followup", dispatchTimeValue);
                } else {
                    populateTimeSlots("followup");
                }
            }
            if (dispatchTimeLabel) dispatchTimeLabel.textContent = 'FOLLOW UP TIME';
        } else if (resolvedValue === 'No | BOSR Created') {
            if (cbr2FieldContainer) cbr2FieldContainer.style.display = 'flex';
            if (cbr2Input) {
                cbr2Input.setAttribute('required', 'required');
                if (isEditingNoteFlag) cbr2Input.value = cbr2Value;
            }
            if (cbr2Label) cbr2Label.textContent = 'BOSR TICKET #';
        } else if (resolvedValue === 'No | NC Ticket Created') {
            if (cbr2FieldContainer) cbr2FieldContainer.style.display = 'flex';
            if (cbr2Input) {
                cbr2Input.setAttribute('required', 'required');
                if (isEditingNoteFlag) cbr2Input.value = cbr2Value;
            }
            if (cbr2Label) cbr2Label.textContent = 'NC TICKET #';
        } else if (resolvedValue === 'Cx ask for a Manager | Unable to de escalate. Manager still needed | Escalate to EMT') {
            if (cbr2FieldContainer) cbr2FieldContainer.style.display = 'flex';
            if (cbr2Input) {
                cbr2Input.setAttribute('required', 'required');
                if (isEditingNoteFlag) cbr2Input.value = cbr2Value;
            }
            if (cbr2Label) cbr2Label.textContent = 'EMT TICKET #';
        }
        applyInitialRequiredHighlight();
        generateFinalNote();
    };

    const populateTimeSlots = (type, selectedTime = '') => {
        if (!dispatchTimeSlotSelect) return;
        dispatchTimeSlotSelect.innerHTML = '<option value="">Select Time Range</option>';
        let timeRanges = [];
        if (type === "dispatch") {
            timeRanges = ["8am - 9am", "9am - 11am", "11am - 1pm", "1pm - 3pm", "3pm - 5pm", "5pm - 7pm", "8am - 5pm"];
        } else if (type === "followup") {
            timeRanges = [
                "8am - 9am", "9am - 10am", "10am - 11am", "11am - 12pm",
                "12pm - 1pm", "1pm - 2pm", "2pm - 3pm", "3pm - 4pm",
                "4pm - 5pm", "5pm - 6pm", "6pm - 7pm", "7pm - 8pm",
                "8pm - 9pm", "9pm - 10pm"
            ];
        }
        timeRanges.forEach(range => {
            const option = document.createElement('option');
            option.value = range;
            option.textContent = range;
            dispatchTimeSlotSelect.appendChild(option);
        });
        if (selectedTime && Array.from(dispatchTimeSlotSelect.options).some(option => option.value === selectedTime)) {
            dispatchTimeSlotSelect.value = selectedTime;
        } else if (selectedTime) {
            dispatchTimeSlotSelect.value = '';
        } else {
            dispatchTimeSlotSelect.value = '';
        }
    };

    const populateExtraStepsSelect = () => {
        if (!extraStepsSelect) return;
        extraStepsSelect.innerHTML = '<option value="">Select an option</option>';
        extraStepsOptions.forEach(optionText => {
            const option = document.createElement('option');
            option.value = optionText;
            option.textContent = optionText;
            extraStepsSelect.appendChild(option);
        });
    };

    const updateStickyHeaderInfo = () => {
        const stickyHeaderContainer = document.querySelector('.sticky-header-container');
        const headerDynamicInfo = get('headerDynamicInfo');
        const agentInfoSection = document.querySelector('.agent-info');
        const headerBanValueSpan = get('headerBan-value');
        const headerCidValueSpan = get('headerCid-value');
        const headerNameValueSpan = get('headerName-value');
        const headerCbrValueSpan = get('headerCbr-value');

        if (!headerDynamicInfo || !agentInfoSection || !headerBanValueSpan || !headerCidValueSpan || !headerNameValueSpan || !headerCbrValueSpan) {
            return;
        }

        const agentInfoRect = agentInfoSection.getBoundingClientRect();
        const shouldShowStickyHeader = agentInfoRect.bottom <= 60;

        headerBanValueSpan.innerText = _getFieldValue('ban') || '';
        headerCidValueSpan.innerText = _getFieldValue('cid') || '';
        headerNameValueSpan.innerText = _getFieldValue('name') || '';
        headerCbrValueSpan.innerText = _getFieldValue('cbr') || '';

        if (shouldShowStickyHeader) {
            headerDynamicInfo.classList.add('show');
        } else {
            headerDynamicInfo.classList.remove('show');
        }
    };

    const applyInitialRequiredHighlight = () => {
        const form = document.getElementById('callNoteForm');
        if (!form) return;

        if (agentNameInput && !_getFieldValue('agentName') && !agentNameInput.readOnly) {
            agentNameInput.classList.add('required-initial-border');
        } else if (agentNameInput) {
            agentNameInput.classList.remove('required-initial-border');
            agentNameInput.style.border = '';
        }

        for (const fieldId in fieldConfig) {
            const config = fieldConfig[fieldId];
            if (fieldId === 'agentName') continue;
            const inputElement = get(fieldId);
            let targetElementOrGroup = inputElement;
            if (config.type === 'radio') {
                targetElementOrGroup = document.querySelectorAll(`input[name="${fieldId}"]`)[0];
            }
            if (!targetElementOrGroup) continue;

            let isHiddenOrDisabled = false;
            const containerElement = targetElementOrGroup.closest('.input-group') || targetElementOrGroup.closest('.radio-group');
            if (containerElement) {
                isHiddenOrDisabled = containerElement.style.display === 'none' || containerElement.classList.contains('hidden-field');
            }
            if (inputElement && inputElement.disabled) {
                isHiddenOrDisabled = true;
            }

            const currentSkill = skillToggle.checked ? 'SHS' : 'FFH';
            const isSpeedOrDeviceField = ['activeDevicesInput', 'totalDevicesInput', 'downloadBeforeInput', 'uploadBeforeInput', 'downloadAfterInput', 'uploadAfterInput'].includes(fieldId);
            if (isSpeedOrDeviceField && currentSkill === 'SHS') {
                isHiddenOrDisabled = true;
            }

            if (config.required && !isHiddenOrDisabled) {
                if (config.type === 'radio') {
                    const radioButtons = document.querySelectorAll(`input[name="${fieldId}"]`);
                    let isChecked = Array.from(radioButtons).some(radio => radio.checked);
                    if (!isChecked) {
                        if (containerElement) containerElement.classList.add('required-initial-border');
                    } else {
                        if (containerElement) {
                            containerElement.classList.remove('required-initial-border');
                            containerElement.style.border = '';
                        }
                    }
                    continue;
                } else {
                    if (fieldId === 'aocInput') {
                        if (inputElement) {
                            inputElement.classList.remove('required-initial-border');
                            inputElement.style.border = '';
                        }
                        continue;
                    }
                    if ((_getFieldValue(fieldId) === '' || (inputElement && inputElement.tagName === 'SELECT' && _getFieldValue(fieldId) === '')) && !isHiddenOrDisabled) {
                        if (inputElement) inputElement.classList.add('required-initial-border');
                    } else {
                        if (inputElement) {
                            inputElement.classList.remove('required-initial-border');
                            inputElement.style.border = '';
                        }
                    }
                }
            } else {
                if (inputElement) {
                    inputElement.classList.remove('required-initial-border');
                    inputElement.style.border = '';
                }
                if (containerElement) {
                    containerElement.classList.remove('required-initial-border');
                    containerElement.style.border = '';
                }
            }
        }
    };

    const initialResizeTextareas = () => {
        document.querySelectorAll('#cxIssueText, #troubleshootingProcessText, #additionalinfoText').forEach(autoResizeTextarea);
    };

    const hideSidebar = () => {
        if (historySidebar) historySidebar.classList.remove('open');
        if (historySidebarOverlay) historySidebarOverlay.style.display = 'none';
        unhighlightAllNotes();
    };
    
    const closeChecklistSidebar = () => {
        if(checklistSidebar) checklistSidebar.classList.remove('open');
        if(checklistSidebarOverlay) checklistSidebarOverlay.style.display = 'none';

        if (_awaitingChecklistCompletionForCopySave) {
            _awaitingChecklistCompletionForCopySave = false;
            viewNoteInModal(_currentlyViewedNoteData || { id: null, finalNoteText: _currentFinalNoteContent, formData: null });
            showToast('Please press "Copy & Save" again.', 'info');
        }
    };

    const showSidebarAndHighlightNote = async (noteId) => {
        if (historySidebar) historySidebar.classList.add('open');
        if (historySidebarOverlay) historySidebarOverlay.style.display = 'block';
        await loadNotes();
        setTimeout(() => {
            const noteElement = noteHistoryList.querySelector(`[data-note-id="${noteId}"]`);
            if (noteElement) {
                unhighlightAllNotes();
                noteElement.classList.add('selected');
                noteElement.classList.add('highlight-red');
                if (highlightTimeout) clearTimeout(highlightTimeout);
                highlightTimeout = setTimeout(() => {
                    noteElement.classList.remove('highlight-red');
                    highlightTimeout = null;
                }, 1000);

                const parentGroupContent = noteElement.closest('.date-group-content');
                if (parentGroupContent && (parentGroupContent.style.maxHeight === '0px' || parentGroupContent.style.opacity === '0')) {
                    parentGroupContent.style.maxHeight = 'none';
                    parentGroupContent.offsetHeight;
                    parentGroupContent.style.maxHeight = parentGroupContent.scrollHeight + 'px';
                    parentGroupContent.style.opacity = '1';
                    const parentGroupHeader = parentGroupContent.closest('.date-group').querySelector('.date-group-header');
                    if (parentGroupHeader) {
                        parentGroupHeader.querySelector('.icon-chevron-down').style.display = 'block';
                        parentGroupHeader.querySelector('.icon-chevron-up').style.display = 'none';
                    }
                }
                noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const unhighlightAllNotes = () => {
        document.querySelectorAll('.note-item.selected').forEach(item => item.classList.remove('selected'));
        document.querySelectorAll('.note-item.highlight-red').forEach(item => item.classList.remove('highlight-red'));
        if (highlightTimeout) {
            clearTimeout(highlightTimeout);
            highlightTimeout = null;
        }
    };

    const closeModal = (keepSidebarClosed = false) => {
        if (noteModalOverlay) noteModalOverlay.style.display = 'none';
        
        if (currentViewedNoteId && !keepSidebarClosed) {
            showSidebarAndHighlightNote(currentViewedNoteId);
        }
        
        currentViewedNoteId = null;
        
        if (modalEditFromHistoryBtn) modalEditFromHistoryBtn.style.display = 'none';
        if (modalNoteTextarea) modalNoteTextarea.value = '';
        
        updateCharCounter(0, modalNoteCharCount, CHARACTER_LIMIT, false, true);
        if (_currentFinalNoteContent) {
             updateCharCounter(_currentFinalNoteContent.length, mainNoteCharCountHeader, CHARACTER_LIMIT, false, true);
        }
    };

    const closeSeparateModal = () => {
        if (separateNoteModalOverlay) separateNoteModalOverlay.style.display = 'none';
        const dynamicPartsContainer = separateNoteModalOverlay.querySelector('.modal-body.separate-notes-container');
        if (dynamicPartsContainer) {
            dynamicPartsContainer.innerHTML = '';
        }

        if (_currentlyViewedNoteData) {
            viewNoteInModal(_currentlyViewedNoteData);
        } else if (_currentFinalNoteContent.trim() !== '') {
            viewNoteInModal({
                id: null,
                finalNoteText: _currentFinalNoteContent,
                formData: null
            });
        }
    };

    const viewNoteInModal = (noteObject) => {
        if (!noteObject) return;
        _currentlyViewedNoteData = noteObject; 
        
        if (modalNoteTextarea) modalNoteTextarea.value = noteObject.finalNoteText;
        if (noteModalOverlay) noteModalOverlay.style.display = 'flex';
        
        currentViewedNoteId = noteObject.id;
        updateCharCounter(noteObject.finalNoteText.length, modalNoteCharCount, CHARACTER_LIMIT, false, true);
        
        if (modalEditFromHistoryBtn) {
            modalEditFromHistoryBtn.style.display = noteObject.id ? 'flex' : 'none';
        }
    };

    const filterNotes = (searchText) => {
        const lowerCaseSearchText = searchText.toLowerCase();
        const dateGroups = noteHistoryList.querySelectorAll('.date-group');
        if (dateGroups.length === 0) {
            if (noNotesMessage) {
                noNotesMessage.textContent = 'No saved notes yet.';
                noNotesMessage.style.display = 'block';
            }
            return;
        }

        let anyNoteVisibleInAnyGroupOverall = false;

        dateGroups.forEach(group => {
            const groupHeaderElement = group.querySelector('.date-group-header h3');
            const groupHeader = groupHeaderElement ? groupHeaderElement.textContent.toLowerCase() : '';
            const groupContent = group.querySelector('.date-group-content');
            const iconDown = group.querySelector('.icon-chevron-down');
            const iconUp = group.querySelector('.icon-chevron-up');
            const noteItems = group.querySelectorAll('.note-item');
            let anyNoteVisibleInThisGroupAfterFilter = false;
            let notesVisibleInThisGroup = 0;

            noteItems.forEach(item => {
                const ban = item.dataset.ban.toLowerCase();
                const cid = item.dataset.cid.toLowerCase();
                const name = item.dataset.name.toLowerCase();
                const cbr = item.dataset.cbr.toLowerCase();
                const ticket = item.dataset.ticket ? item.dataset.ticket.toLowerCase() : '';
                const cbr2 = item.dataset.cbr2 ? item.dataset.cbr2.toLowerCase() : '';
                const noteTextContent = item.dataset.noteText ? item.dataset.noteText.toLowerCase() : '';

                if (ban.includes(lowerCaseSearchText) ||
                    cid.includes(lowerCaseSearchText) ||
                    name.includes(lowerCaseSearchText) ||
                    cbr.includes(lowerCaseSearchText) ||
                    ticket.includes(lowerCaseSearchText) ||
                    cbr2.includes(lowerCaseSearchText) ||
                    noteTextContent.includes(lowerCaseSearchText) ||
                    groupHeader.includes(lowerCaseSearchText)
                ) {
                    item.style.display = 'flex';
                    anyNoteVisibleInThisGroupAfterFilter = true;
                    anyNoteVisibleInAnyGroupOverall = true;
                    notesVisibleInThisGroup++;
                } else {
                    item.style.display = 'none';
                }
            });

            const noteCountSpan = group.querySelector('.note-count');
            if (noteCountSpan) {
                noteCountSpan.textContent = `${notesVisibleInThisGroup}`;
            }


            if (searchText === '') {
                const isTodayGroup = groupHeaderElement && groupHeaderElement.textContent === 'Today';
                if (isTodayGroup) {
                    groupContent.style.maxHeight = 'none';
                    groupContent.offsetHeight;
                    groupContent.style.maxHeight = groupContent.scrollHeight + 'px';
                    groupContent.style.opacity = '1';
                    if (iconDown) iconDown.style.display = 'block';
                    if (iconUp) iconUp.style.display = 'none';
                } else {
                    groupContent.style.maxHeight = '0px';
                    groupContent.style.opacity = '0';
                    if (iconDown) iconDown.style.display = 'none';
                    if (iconUp) iconUp.style.display = 'block';
                }
                group.style.display = 'block';
            } else {
                if (anyNoteVisibleInThisGroupAfterFilter) {
                    group.style.display = 'block';
                    groupContent.style.maxHeight = 'none';
                    groupContent.offsetHeight;
                    groupContent.style.maxHeight = groupContent.scrollHeight + 'px';
                    groupContent.style.opacity = '1';
                    if (iconDown) iconDown.style.display = 'block';
                    if (iconUp) iconUp.style.display = 'none';
                } else {
                    group.style.display = 'none';
                    groupContent.style.maxHeight = '0px';
                    groupContent.style.opacity = '0';
                    if (iconDown) iconDown.style.display = 'none';
                    if (iconUp) iconUp.style.display = 'block';
                }
            }
        });

        if (noNotesMessage) {
            const notes = _historyNotesCache;
            if (notes.length === 0) {
                noNotesMessage.textContent = 'No saved notes yet.';
                noNotesMessage.style.display = 'block';
            } else if (!anyNoteVisibleInAnyGroupOverall && searchText !== '') {
                noNotesMessage.textContent = 'No notes found matching the search.';
                noNotesMessage.style.display = 'block';
            } else {
                noNotesMessage.style.display = 'none';
            }
        }
    }

    // --- BEGIN: Import/Export Functions ---
    /**
     * Exports all notes from the database to a JSON file.
     */
    const exportNotes = async () => {
        hideSidebar();
        try {
            const allNotes = await db.notes.toArray();
            if (allNotes.length === 0) {
                showToast('There are no notes to export.', 'warning');
                return;
            }

            const jsonString = JSON.stringify(allNotes, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `apad_notes_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Notes successfully exported!', 'success');
        } catch (error) {
            console.error('Error exporting notes:', error);
            showToast('An error occurred while exporting notes.', 'error');
        }
    };

    /**
     * Imports notes from a selected JSON file into the database.
     * @param {Event} event - The file input change event.
     */
    const importNotes = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (!Array.isArray(data) || data.some(item => !item.id || !item.formData)) {
                    throw new Error('Invalid file format. The file must be an array of notes from this application.');
                }
                
                const confirmed = await customConfirm(`You are about to import ${data.length} notes. This will add them to your existing history and overwrite any notes with the same ID. Do you want to continue?`);

                if (!confirmed) {
                    showToast('Import canceled.', 'info');
                    if (importFile) importFile.value = ''; // Reset file input
                    return;
                }

                // Using bulkPut to add new notes and update existing ones.
                await db.notes.bulkPut(data);
                
                showToast(`${data.length} notes have been successfully imported.`, 'success');
                await loadNotes(); // Refresh the history list
                hideSidebar();

            } catch (error) {
                console.error('Error importing notes:', error);
                showToast(error.message || 'Error importing notes. Please check the file and try again.', 'error');
            } finally {
                if (importFile) importFile.value = ''; // Reset file input
            }
        };
        reader.onerror = () => {
            showToast('Failed to read the file.', 'error');
        };
        reader.readAsText(file);
    };
    // --- END: Import/Export Functions ---

    // =================================================================================
    // 5. EVENT HANDLERS
    // =================================================================================

    const saveAgentNameOnBlur = async () => {
        if (isAgentNameEditable) await saveAgentName();
    };

    const saveAgentNameOnEnter = async (event) => {
        if (event.key === 'Enter' && isAgentNameEditable) {
            event.preventDefault();
            await saveAgentName();
            if (agentNameInput) agentNameInput.blur();
        }
    };

    const handleAwaAlertsMainDropdownChange = () => {
        const isAwaAlertsMainSelected = _getFieldValue('awaAlertsSelect') !== '';
        if (!isEditingNoteFlag) {
            if (isAwaAlertsMainSelected && enableAwaAlerts2 && !enableAwaAlerts2.checked) {
                enableAwaAlerts2.checked = true;
                updateAwaAlerts2SelectState(enableAwaAlerts2.checked, awaAlerts2Select.value);
            } else if (!isAwaAlertsMainSelected && enableAwaAlerts2 && enableAwaAlerts2.checked) {
                enableAwaAlerts2.checked = false;
                updateAwaAlerts2SelectState(enableAwaAlerts2.checked, awaAlerts2Select.value);
            }
        } else {
            updateAwaAlerts2SelectState(enableAwaAlerts2.checked, awaAlerts2Select.value);
        }
        updateAwaStepsSelectState();
    };

    const handleAwaAlerts2CheckboxToggle = () => {
        updateAwaAlerts2SelectState(enableAwaAlerts2.checked, awaAlerts2Select.value);
    };

    const handleResolvedSelectChange = () => {
        if (!resolvedSelect || !transferCheckbox) return;
        const resolvedValue = _getFieldValue('resolvedSelect');
        const shouldShowTransfer = (resolvedValue === 'Cx need to be transfered');
        if (!isEditingNoteFlag) {
            if (shouldShowTransfer && !transferCheckbox.checked) {
                transferCheckbox.checked = true;
                updateTransferFieldState(transferCheckbox.checked, transferSelect.value);
            } else if (!shouldShowTransfer && transferCheckbox.checked) {
                transferCheckbox.checked = false;
                updateTransferFieldState(transferCheckbox.checked, transferSelect.value);
            }
        } else {
            updateTransferFieldState(transferCheckbox.checked, transferSelect.value);
        }
        updateTechFieldsVisibilityAndState(resolvedValue);
        applyInitialRequiredHighlight();
        generateFinalNote();
    };

    const handleSkillChange = () => {
        const isSHS = skillToggle.checked;
        if (skillTextIndicator) {
            skillTextIndicator.textContent = isSHS ? 'SHS' : 'FFH';
        }

        const currentService = _getFieldValue('serviceSelect');

        if (isSHS) {
            serviceSelect.value = 'SHS Legacy';
            serviceSelect.disabled = true;
            serviceSelect.dispatchEvent(new Event('change'));

            if (!isEditingNoteFlag) {
                if (enablePhysicalCheck2) enablePhysicalCheck2.checked = false;
                if (enablePhysicalCheck3) enablePhysicalCheck3.checked = false;
                if (enablePhysicalCheck4) enablePhysicalCheck4.checked = false;
            }
            _populateAwaAlertsOptions('SHS', awaAlertsSelect.value);
            updateAwaAlerts2SelectState(enableAwaAlerts2.checked, awaAlerts2Select.value);
            updateAwaStepsSelectState(awaStepsSelect.value);

            if (activeDevicesGroup) activeDevicesGroup.style.display = 'none';
            if (totalDevicesGroup) totalDevicesGroup.style.display = 'none';
            if (downloadBeforeGroup) downloadBeforeGroup.style.display = 'none';
            if (uploadBeforeGroup) uploadBeforeGroup.style.display = 'none';
            if (downloadAfterGroup) downloadAfterGroup.style.display = 'none';
            if (uploadAfterGroup) uploadAfterGroup.style.display = 'none';

            if (activeDevicesInput) activeDevicesInput.value = '';
            if (totalDevicesInput) totalDevicesInput.value = '';
            if (downloadBeforeInput) downloadBeforeInput.value = '';
            if (uploadBeforeInput) uploadBeforeInput.value = '';
            if (downloadAfterInput) downloadAfterInput.value = '';
            if (uploadAfterInput) uploadAfterInput.value = '';

        } else {
            serviceSelect.disabled = false;
            if (currentService === 'SHS Legacy') {
                serviceSelect.value = '';
                serviceSelect.dispatchEvent(new Event('change'));
            }

            _populatePhysicalCheckListLabelsAndOptions(_getFieldValue('serviceSelect'));
            _updatePhysicalCheckListEnablement(_getFieldValue('serviceSelect'), enablePhysicalCheck2.checked, enablePhysicalCheck3.checked, enablePhysicalCheck4.checked);

            _populateAwaAlertsOptions('FFH', awaAlertsSelect.value);
            updateAwaAlerts2SelectState(enableAwaAlerts2.checked, awaAlerts2Select.value);
            updateAwaStepsSelectState(awaStepsSelect.value);

            if (activeDevicesGroup) activeDevicesGroup.style.display = 'flex';
            if (totalDevicesGroup) totalDevicesGroup.style.display = 'flex';
            if (downloadBeforeGroup) downloadBeforeGroup.style.display = 'flex';
            if (uploadBeforeGroup) uploadBeforeGroup.style.display = 'flex';
            if (downloadAfterGroup) downloadAfterGroup.style.display = 'flex';
            if (uploadAfterGroup) uploadAfterGroup.style.display = 'flex';
        }
        applyInitialRequiredHighlight();
        generateFinalNote();
    };

    const handleResolutionCopy = async (sourceData = null) => {
        const cxIssueVal = _getFieldValue('cxIssueText', sourceData);
        const tsStepsVal = _getFieldValue('troubleshootingProcessText', sourceData);
        if (!cxIssueVal && !tsStepsVal) {
             showToast('No resolution information to copy.', 'warning');
             return;
        }

        let combinedResolutionText = '';
        if (cxIssueVal) combinedResolutionText += `CX ISSUE: ${cxIssueVal}`;
        if (tsStepsVal) {
            if (combinedResolutionText) combinedResolutionText += '\n';
            combinedResolutionText += `TS STEPS: ${tsStepsVal}`;
        }
        let finalTextToCopy = combinedResolutionText;
        if (combinedResolutionText.length > RESOLUTION_COPY_CHAR_LIMIT) {
            finalTextToCopy = tsStepsVal ? `TS STEPS: ${tsStepsVal}` : '';
            if (!finalTextToCopy) {
                showToast('Resolution exceeds character limit and there are no troubleshooting steps to copy.', 'warning');
                return;
            }
        }
        if (finalTextToCopy) {
            await copyToClipboard(finalTextToCopy);
        } else {
            showToast('No resolution information to copy.', 'warning');
        }
    };

    const handleCopilotCopy = async (sourceNoteText) => {
        if (!sourceNoteText) {
            showToast('No note to send to Copilot.', 'warning');
            return;
        }
        const noteLines = sourceNoteText.split('\n');
        const filteredNote = noteLines.filter(line => !line.startsWith('PFTS |') && !line.startsWith('SKILL:') && !line.startsWith('BAN:') && !line.startsWith('CID:') && !line.startsWith('NAME:') && !line.startsWith('CBR:') && !line.startsWith('CALLER:') && !line.startsWith('VERIFIED BY:') && !line.startsWith('ADDRESS:') && !line.startsWith('XID:')).join('\n');
        await copyToClipboard(filteredNote);
    };

    const handleChecklistChange = (event) => {
        const radio = event.target;
        if (radio.type !== 'radio') return;

        const parentItem = radio.closest('.checklist-item');
        if (!parentItem) return;

        parentItem.classList.remove('status-pending', 'status-yes', 'status-no', 'status-na', 'checklist-item-required', 'status-follow-up-yes', 'status-follow-up-no');

        switch (radio.value) {
            case 'yes':
                if (radio.name === 'checklistFollowUp') {
                    parentItem.classList.add('status-follow-up-yes');
                } else {
                    parentItem.classList.add('status-yes');
                }
                break;
            case 'no':
                 if (radio.name === 'checklistFollowUp') {
                    parentItem.classList.add('status-follow-up-no');
                } else {
                    parentItem.classList.add('status-no');
                }
                break;
            case 'na':
                parentItem.classList.add('status-na');
                break;
        }
    };
    
    // =================================================================================
    // 6. INITIALIZATION
    // =================================================================================

    const initializeEventListeners = () => {
        console.log('initializeEventListeners: Setting up all event listeners...');

        if (editAgentNameBtn) {
            editAgentNameBtn.addEventListener('click', () => {
                setAgentNameEditable();
            });
        }
        if (btnSave) {
            btnSave.addEventListener('click', async () => {
                const saved = await saveCurrentNote();
                if (saved) clearAllFormFields();
            });
        }
        if (btnReset) {
            btnReset.addEventListener('click', async () => {
                const hasData = checkCurrentFormHasData();
                if (hasData) {
                    const confirmed = await customConfirm('Are you sure you want to clear all information from the form? This action cannot be undone.');
                    if (!confirmed) {
                        showToast('Reset canceled.', 'info');
                        return;
                    }
                }
                currentViewedNoteId = null;
                _lastNoteIdBeforeModalTransition = null;
                if (noteModalOverlay) noteModalOverlay.style.display = 'none';
                if (separateNoteModalOverlay) separateNoteModalOverlay.style.display = 'none';
                clearAllFormFields();
                hideSidebar();
                showToast('Form reset.', 'info');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (banInput) {
                    banInput.focus();
                }
            });
        }
        if (btnHistory) {
            btnHistory.addEventListener('click', async () => {
                await loadNotes();
                if (historySidebar) historySidebar.classList.add('open');
                if (historySidebarOverlay) historySidebarOverlay.style.display = 'block';
                historySearchInput.value = '';
                unhighlightAllNotes();
                _lastNoteIdBeforeModalTransition = null;
                currentViewedNoteId = null;
              iniciarTourHistory(); // <--- AÑADE ESTA LÍNEA
            });
        }

        // --- BEGIN: Import/Export Event Listeners ---
        if (exportBtn) {
            exportBtn.addEventListener('click', exportNotes);
        }
        if (importBtn) {
            importBtn.addEventListener('click', () => importFile.click());
        }
        if (importFile) {
            importFile.addEventListener('change', importNotes);
        }
        // --- END: Import/Export Event Listeners ---

        if (btnChecklistMenu) {
            btnChecklistMenu.addEventListener('click', () => {
                if(checklistSidebar) checklistSidebar.classList.add('open');
                if(checklistSidebarOverlay) checklistSidebarOverlay.style.display = 'block';
              iniciarTourChecklist(); // <--- AÑADE ESTA LÍNEA
            });
        }
        if (closeChecklistBtn) closeChecklistBtn.addEventListener('click', closeChecklistSidebar);
        if (checklistSidebarOverlay) checklistSidebarOverlay.addEventListener('click', closeChecklistSidebar);
        if (checklistSidebar) checklistSidebar.addEventListener('change', handleChecklistChange);
       
        if (goCheckPhysicalLink) {
            goCheckPhysicalLink.addEventListener('click', () => {
                setChecklistValue('checklistCheckPhysical', 'yes');
            });
        }
        if (goTsCopilotLink) {
            goTsCopilotLink.addEventListener('click', () => {
                setChecklistValue('checklistTsCopilot', 'yes');
            });
        }

        document.querySelectorAll('.checklist-section-title').forEach(title => {
            title.addEventListener('click', (event) => {
                if (event.target.closest('.clean-checklist-section-btn')) {
                    return;
                }
                const content = title.nextElementSibling;
                if(content && content.classList.contains('checklist-items-container')) {
                    content.classList.toggle('collapsed');
                    title.classList.toggle('collapsed');

                    if (!content.classList.contains('collapsed')) {
                        content.style.maxHeight = 'none';
                        content.offsetHeight;
                        content.style.maxHeight = content.scrollHeight + 'px';
                        content.style.opacity = '1';
                    } else {
                        content.style.maxHeight = content.scrollHeight + 'px';
                        requestAnimationFrame(() => {
                            content.style.maxHeight = '0px';
                            content.style.opacity = '0';
                        });
                    }
                    const iconDown = title.querySelector('.icon-chevron-down');
                    const iconUp = title.querySelector('.icon-chevron-up');
                    if (iconDown && iconUp) {
                        if (title.classList.contains('collapsed')) {
                            iconDown.style.display = 'none';
                            iconUp.style.display = 'block';
                        } else {
                            iconDown.style.display = 'block';
                            iconUp.style.display = 'none';
                        }
                    }
                }
            });
        });

        document.querySelectorAll('.clean-section-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                cleanSection(event.currentTarget.dataset.sectionId);
            });
        });

        if(btnChecklistYesAll) {
            btnChecklistYesAll.addEventListener('click', () => {
                const allChecklistItems = checklistSidebar.querySelectorAll('.checklist-item');
                allChecklistItems.forEach(item => {
                    const radios = item.querySelectorAll('input[type="radio"]');
                    let isAlreadySelected = false;
                    radios.forEach(radio => {
                        if (radio.checked) {
                            isAlreadySelected = true;
                        }
                    });

                    if (!isAlreadySelected) {
                        const yesRadio = item.querySelector('input[value="yes"]');
                        if (yesRadio) {
                           setChecklistValue(yesRadio.name, 'yes');
                        }
                    }
                });
                showToast('All remaining checklist options marked as "Yes".', 'success');
            });
        }

        sections.forEach(section => {
            const title = section.querySelector('.section-title');
            if (title) {
                title.addEventListener('click', (event) => {
                    if (!event.target.closest('.clean-section-btn')) {
                        section.classList.toggle('collapsed');
                    }
                });
            }
        });

        document.querySelectorAll('.copy-button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const buttonElement = event.target.closest('.copy-button');
                if (!buttonElement) return;
                const targetInputId = buttonElement.dataset.target;
                const targetInput = get(targetInputId);
                if (targetInput) {
                    await copyToClipboard(targetInput.value);
                }
            });
        });

        if (confirmYesBtn) confirmYesBtn.addEventListener('click', () => {
            if (customConfirmModal) customConfirmModal.style.display = 'none';
            if (resolveConfirmPromise) resolveConfirmPromise(true);
        });

        if (confirmNoBtn) confirmNoBtn.addEventListener('click', () => {
            if (customConfirmModal) customConfirmModal.style.display = 'none';
            if (resolveConfirmPromise) resolveConfirmPromise(false);
        });

        if (customConfirmModal) customConfirmModal.addEventListener('click', (event) => {
            if (event.target === customConfirmModal) {
                customConfirmModal.style.display = 'none';
                if (resolveConfirmPromise) resolveConfirmPromise(false);
            }
        });

        if (callerSelect) {
            callerSelect.addEventListener('change', () => {
                updateThirdRowLayout();
                generateFinalNote();
            });
        }

        if (serviceSelect) {
            serviceSelect.addEventListener('change', () => {
                const selectedService = _getFieldValue('serviceSelect');
                populateIssueSelect(selectedService);
                updateAffectedFieldVisibilityAndLabel(selectedService);
                _populatePhysicalCheckListLabelsAndOptions(selectedService);
                _updatePhysicalCheckListEnablement(selectedService, enablePhysicalCheck2.checked, enablePhysicalCheck3.checked, enablePhysicalCheck4.checked);
                updateOptikTvLegacySpecificFields(selectedService);
                applyInitialRequiredHighlight();
                generateFinalNote();
            });
        }

        if (enablePhysicalCheck2) enablePhysicalCheck2.addEventListener('change', () => {
            _updatePhysicalCheckListEnablement(_getFieldValue('serviceSelect'), enablePhysicalCheck2.checked, enablePhysicalCheck3.checked, enablePhysicalCheck4.checked);
            applyInitialRequiredHighlight();
            generateFinalNote();
        });
        if (enablePhysicalCheck3) enablePhysicalCheck3.addEventListener('change', () => {
            _updatePhysicalCheckListEnablement(_getFieldValue('serviceSelect'), enablePhysicalCheck2.checked, enablePhysicalCheck3.checked, enablePhysicalCheck4.checked);
            applyInitialRequiredHighlight();
            generateFinalNote();
        });
        if (enablePhysicalCheck4) enablePhysicalCheck4.addEventListener('change', () => {
            _updatePhysicalCheckListEnablement(_getFieldValue('serviceSelect'), enablePhysicalCheck2.checked, enablePhysicalCheck3.checked, enablePhysicalCheck4.checked);
            applyInitialRequiredHighlight();
            generateFinalNote();
        });

        if (physicalCheckList1Select) {
            physicalCheckList1Select.addEventListener('change', () => {
                const selectedService = _getFieldValue('serviceSelect');
                const currentSkill = skillToggle.checked ? 'SHS' : 'FFH';
                const isSHS = currentSkill === 'SHS';
                if (selectedService !== '' && (isSHS || !SERVICES_TO_HIDE_PHYSICAL_CHECK.includes(selectedService))) {
                    if (!isEditingNoteFlag && _getFieldValue('physicalCheckList1Select') !== '' && enablePhysicalCheck2 && !enablePhysicalCheck2.checked) {
                        enablePhysicalCheck2.checked = true;
                        _updatePhysicalCheckListEnablement(selectedService, enablePhysicalCheck2.checked, enablePhysicalCheck3.checked, enablePhysicalCheck4.checked);
                    } else if (!isEditingNoteFlag && _getFieldValue('physicalCheckList1Select') === '' && enablePhysicalCheck2 && enablePhysicalCheck2.checked) {
                        enablePhysicalCheck2.checked = false;
                        _updatePhysicalCheckListEnablement(selectedService, enablePhysicalCheck2.checked, enablePhysicalCheck3.checked, enablePhysicalCheck4.checked);
                    }
                } else {
                    if (enablePhysicalCheck2) enablePhysicalCheck2.checked = false;
                    if (enablePhysicalCheck3) enablePhysicalCheck3.checked = false;
                    if (enablePhysicalCheck4) enablePhysicalCheck4.checked = false;
                    _updatePhysicalCheckListEnablement(selectedService, false, false, false);
                }
            });
        }
        if (physicalCheckList2Select) {
            physicalCheckList2Select.addEventListener('change', () => {
                const selectedService = _getFieldValue('serviceSelect');
                const currentSkill = skillToggle.checked ? 'SHS' : 'FFH';
                const isSHS = currentSkill === 'SHS';
                if (selectedService !== '' && (isSHS || !SERVICES_TO_HIDE_PHYSICAL_CHECK.includes(selectedService))) {
                    if (!isEditingNoteFlag && _getFieldValue('physicalCheckList2Select') !== '' && enablePhysicalCheck3 && !enablePhysicalCheck3.checked) {
                        enablePhysicalCheck3.checked = true;
                        _updatePhysicalCheckListEnablement(selectedService, enablePhysicalCheck2.checked, enablePhysicalCheck3.checked, enablePhysicalCheck4.checked);
                    } else if (!isEditingNoteFlag && _getFieldValue('physicalCheckList2Select') === '' && enablePhysicalCheck3 && enablePhysicalCheck3.checked) {
                        enablePhysicalCheck3.checked = false;
                        _updatePhysicalCheckListEnablement(selectedService, enablePhysicalCheck2.checked, enablePhysicalCheck3.checked, enablePhysicalCheck4.checked);
                    }
                } else {
                    if (enablePhysicalCheck2) enablePhysicalCheck2.checked = false;
                    if (enablePhysicalCheck3) enablePhysicalCheck3.checked = false;
                    if (enablePhysicalCheck4) enablePhysicalCheck4.checked = false;
                    _updatePhysicalCheckListEnablement(selectedService, false, false, false);
                }
            });
        }
        if (physicalCheckList3Select) {
            physicalCheckList3Select.addEventListener('change', () => {
                const selectedService = _getFieldValue('serviceSelect');
                const currentSkill = skillToggle.checked ? 'SHS' : 'FFH';
                const isSHS = currentSkill === 'SHS';
                if (selectedService !== '' && (isSHS || !SERVICES_TO_HIDE_PHYSICAL_CHECK.includes(selectedService))) {
                    if (!isEditingNoteFlag && _getFieldValue('physicalCheckList3Select') !== '' && enablePhysicalCheck4 && !enablePhysicalCheck4.checked) {
                        enablePhysicalCheck4.checked = true;
                        _updatePhysicalCheckListEnablement(selectedService, enablePhysicalCheck2.checked, enablePhysicalCheck3.checked, enablePhysicalCheck4.checked);
                    } else if (!isEditingNoteFlag && _getFieldValue('physicalCheckList3Select') === '' && enablePhysicalCheck4 && enablePhysicalCheck4.checked) {
                        enablePhysicalCheck4.checked = false;
                        _updatePhysicalCheckListEnablement(selectedService, enablePhysicalCheck2.checked, enablePhysicalCheck3.checked, enablePhysicalCheck4.checked);
                    }
                } else {
                    if (enablePhysicalCheck2) enablePhysicalCheck2.checked = false;
                    if (enablePhysicalCheck3) enablePhysicalCheck3.checked = false;
                    if (enablePhysicalCheck4) enablePhysicalCheck4.checked = false;
                    _updatePhysicalCheckListEnablement(selectedService, false, false, false);
                }
            });
        }

        const cleanSection = (sectionId) => {
            const section = get(sectionId);
            if (!section) return;

            section.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([readonly]), select, textarea')
                .forEach(input => input.value = '');
            section.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
            section.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                if (checkbox.id !== 'transferCheckbox') checkbox.checked = false;
            });

            if (sectionId === 'seccion1') {
                updateThirdRowLayout();
            } else if (sectionId === 'seccion2') {
                if (serviceSelect) {
                    serviceSelect.value = '';
                    serviceSelect.dispatchEvent(new Event('change'));
                }
            } else if (sectionId === 'seccion3') {
                if (awaAlertsSelect) {
                    awaAlertsSelect.value = '';
                    awaAlertsSelect.dispatchEvent(new Event('change'));
                }
                if (tvsSelect) {
                    tvsSelect.value = '';
                    tvsSelect.dispatchEvent(new Event('change'));
                }
                if (extraStepsSelect) {
                    extraStepsSelect.value = '';
                    extraStepsSelect.dispatchEvent(new Event('change'));
                }
                if ((skillToggle.checked ? 'SHS' : 'FFH') === 'SHS') {
                    if (activeDevicesInput) activeDevicesInput.value = '';
                    if (totalDevicesInput) totalDevicesInput.value = '';
                    if (downloadBeforeInput) downloadBeforeInput.value = '';
                    if (uploadBeforeInput) uploadBeforeInput.value = '';
                    if (downloadAfterInput) downloadAfterInput.value = '';
                    if (uploadAfterInput) uploadAfterInput.value = '';

                    if (activeDevicesGroup) activeDevicesGroup.style.display = 'none';
                    if (totalDevicesGroup) totalDevicesGroup.style.display = 'none';
                    if (downloadBeforeGroup) downloadBeforeGroup.style.display = 'none';
                    if (uploadBeforeGroup) uploadBeforeGroup.style.display = 'none';
                    if (downloadAfterGroup) downloadAfterGroup.style.display = 'none';
                    if (uploadAfterGroup) uploadAfterGroup.style.display = 'none';
                } else {
                    if (activeDevicesInput) activeDevicesInput.value = '';
                    if (totalDevicesInput) totalDevicesInput.value = '';
                    if (downloadBeforeInput) downloadBeforeInput.value = '';
                    if (uploadBeforeInput) uploadBeforeInput.value = '';
                    if (downloadAfterInput) downloadAfterInput.value = '';
                    if (uploadAfterInput) uploadAfterInput.value = '';

                    if (activeDevicesGroup) activeDevicesGroup.style.display = 'flex';
                    if (totalDevicesGroup) totalDevicesGroup.style.display = 'flex';
                    if (downloadBeforeGroup) downloadBeforeGroup.style.display = 'flex';
                    if (uploadBeforeGroup) uploadBeforeGroup.style.display = 'flex';
                    if (downloadAfterGroup) downloadAfterGroup.style.display = 'flex';
                    if (uploadAfterGroup) uploadAfterGroup.style.display = 'flex';
                }
            } else if (sectionId === 'seccion4') {
                if (resolvedSelect) {
                    resolvedSelect.value = '';
                    resolvedSelect.dispatchEvent(new Event('change'));
                }
                if (csrOrderInput) csrOrderInput.value = '';
                if (ticketInput) ticketInput.value = '';
            }
            handleSkillChange();
            applyInitialRequiredHighlight();
            generateFinalNote();
            const sectionTitleElement = section.querySelector('.section-title');
            const sectionTitleText = sectionTitleElement ? sectionTitleElement.textContent.trim().replace('Clean section', '').trim() : sectionId;
            showToast(`Section "${sectionTitleText}" cleared.`, 'info');
        };

        document.querySelectorAll('.clean-section-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                cleanSection(event.currentTarget.dataset.sectionId);
            });
        });

        if (btnSee) {
            btnSee.addEventListener('click', () => {
                const currentNote = _currentFinalNoteContent;
                if (currentNote.trim() === '') {
                    showToast('Current note is empty. Please fill the form.', 'warning');
                } else {
                    viewNoteInModal({
                        id: null,
                        finalNoteText: currentNote,
                        formData: null 
                    });
                    _lastNoteIdBeforeModalTransition = null;
                }
                iniciarTourNoteModal();
            });
        }

        if (issueSelect) {
            issueSelect.addEventListener('change', () => {
                if ((skillToggle.checked ? 'SHS' : 'FFH') === 'SHS') {
                    _populatePhysicalCheckListLabelsAndOptions(
                        _getFieldValue('serviceSelect'),
                        physicalCheckList1Select.value,
                        physicalCheckList2Select.value,
                        physicalCheckList3Select.value,
                        physicalCheckList4Select.value,
                        _getFieldValue('issueSelect')
                    );
                }
                generateFinalNote();
            });
        }

        if (callNoteForm) {
            callNoteForm.addEventListener('input', (event) => {
                const target = event.target;
                if (numericFields.includes(target.id)) {
                    target.value = target.value.replace(/[^0-9.]/g, '');
                } else if (target.id === 'name') {
                    target.value = target.value.replace(/[^A-Za-z\s]/g, '');
                }
                if (target.type === 'radio' || target.type === 'checkbox') {
                    const fieldName = target.name || target.id;
                    const config = fieldConfig[fieldName];
                    if (config && config.required) {
                        const groupContainer = (target.type === 'radio') ? target.closest('.radio-group') : target.closest('.input-group');
                        if (groupContainer) {
                            let isChecked = Array.from(document.querySelectorAll(`input[name="${fieldName}"]`)).some(radio => radio.checked);
                            if (!isChecked) {
                                groupContainer.classList.add('required-initial-border');
                                groupContainer.style.border = '';
                            } else {
                                groupContainer.classList.remove('required-initial-border');
                                groupContainer.style.border = '';
                            }
                        }
                    }
                    generateFinalNote();
                    return;
                }
                if (target.id === 'cxIssueText' || target.id === 'troubleshootingProcessText' || target.id === 'additionalinfoText') {
                    autoResizeTextarea(target);
                }
                if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
                    const config = fieldConfig[target.id];
                    const containerHidden = target.closest('.input-group') && (target.closest('.input-group').style.display === 'none' || target.closest('.input-group').classList.contains('hidden-field'));
                    const isHiddenOrDisabled = containerHidden || target.disabled;
                    if (config && config.required && !isHiddenOrDisabled) {
                        if (target.id === 'aocInput') {
                            target.classList.remove('required-initial-border');
                            target.style.border = '';
                            return;
                        }
                        if ((_getFieldValue(target.id) === '' || (target.tagName === 'SELECT' && _getFieldValue(target.id) === '')) && !isHiddenOrDisabled) {
                            target.classList.add('required-initial-border');
                        } else {
                            target.classList.remove('required-initial-border');
                            target.style.border = '';
                        }
                    } else {
                        target.classList.remove('required-initial-border');
                        target.style.border = '';
                    }
                }
                generateFinalNote();
            });
        }

        if (agentNameInput) {
            agentNameInput.addEventListener('input', () => {
                if (_getFieldValue('agentName') !== '') {
                    agentNameInput.classList.remove('required-initial-border');
                    agentNameInput.style.border = '';
                } else {
                    agentNameInput.classList.add('required-initial-border');
                }
                generateFinalNote();
            });
        }

        [
            physicalCheckList1Select, physicalCheckList2Select, physicalCheckList3Select, physicalCheckList4Select,
            xVuStatusSelect, packetLossSelect,
            awaAlertsSelect, awaAlerts2Select, awaStepsSelect,
            tvsSelect, tvsKeyInput,
            extraStepsSelect,
            cbr2Input, aocInput,
            csrOrderInput, dispatchDateInput, dispatchTimeSlotSelect
        ].forEach(element => {
            if (!element) return;
            element.addEventListener('change', generateFinalNote);
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.type === 'date') {
                element.addEventListener('input', generateFinalNote);
            }
            element.addEventListener('input', (event) => {
                const el = event.target;
                const config = fieldConfig[el.id];
                const containerHidden = el.closest('.input-group') && (el.closest('.input-group').style.display === 'none' || el.closest('.input-group').classList.contains('hidden-field'));
                const isHiddenOrDisabled = containerHidden || el.disabled;
                if (config && config.required && !isHiddenOrDisabled) {
                    if (el.id === 'aocInput') {
                        el.classList.remove('required-initial-border');
                        el.style.border = '';
                        return;
                    }
                    if ((_getFieldValue(el.id) === '' || (el.tagName === 'SELECT' && _getFieldValue(el.id) === '')) && !isHiddenOrDisabled) {
                        el.classList.add('required-initial-border');
                    } else {
                        el.classList.remove('required-initial-border');
                        el.style.border = '';
                    }
                } else {
                    el.classList.remove('required-initial-border');
                    el.style.border = '';
                }
            });
        });

        [activeDevicesInput, totalDevicesInput, downloadBeforeInput, uploadBeforeInput, downloadAfterInput, uploadAfterInput].forEach(element => {
            if (!element) return;
            element.addEventListener('input', generateFinalNote);
            element.addEventListener('change', generateFinalNote);
        });

        if (ticketInput) {
            ticketInput.addEventListener('input', generateFinalNote);
            ticketInput.addEventListener('input', (event) => {
                const el = event.target;
                const ticketInputGroup = el.closest('.input-group');
                const isHiddenOrDisabled = (ticketInputGroup && ticketInputGroup.style.display === 'none');

                if (fieldConfig.ticketInput.required && !isHiddenOrDisabled) {
                    if (_getFieldValue(el.id) === '') {
                        el.classList.add('required-initial-border');
                    } else {
                        el.classList.remove('required-initial-border');
                        el.style.border = '';
                    }
                } else {
                    el.classList.remove('required-initial-border');
                    el.style.border = '';
                }
            });
        }

        if(skillToggle) skillToggle.addEventListener('change', handleSkillChange);
        if (awaAlertsSelect) awaAlertsSelect.addEventListener('change', handleAwaAlertsMainDropdownChange);
        if (enableAwaAlerts2) enableAwaAlerts2.addEventListener('change', handleAwaAlerts2CheckboxToggle);
        if (tvsSelect) tvsSelect.addEventListener('change', () => updateTvsKeyFieldState());
        if (resolvedSelect) resolvedSelect.addEventListener('change', handleResolvedSelectChange);
        if (transferCheckbox) transferCheckbox.addEventListener('change', () => updateTransferFieldState());

        if (noteModalOverlay) noteModalOverlay.addEventListener('click', (event) => {
            if (event.target === noteModalOverlay) closeModal();
        });
        if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => closeModal());
        if (modalCloseBtnBottom) modalCloseBtnBottom.addEventListener('click', () => closeModal());

        if (modalEditFromHistoryBtn) {
            modalEditFromHistoryBtn.addEventListener('click', async () => {
                if (currentViewedNoteId) {
                    const noteIdToEdit = currentViewedNoteId;
                    const noteToLoad = _historyNotesCache.find(n => n.id === noteIdToEdit);
                    if (noteToLoad) {
                        _lastNoteIdBeforeModalTransition = noteIdToEdit;
                        closeModal(true);
                        await editNote(noteToLoad.formData, noteToLoad.id);
                    } else {
                        showToast('Error: Note not found for editing.', 'error');
                    }
                } else {
                    showToast('No note selected from history to edit.', 'warning');
                }
            });
        }

        if (modalCopyBtn) modalCopyBtn.addEventListener('click', async () => await copyToClipboard(modalNoteTextarea.value));
        
        if (modalCopilotBtn) {
            modalCopilotBtn.addEventListener('click', () => handleCopilotCopy(modalNoteTextarea.value));
        }
        
        if (separateModalCopilotBtn) {
            separateModalCopilotBtn.addEventListener('click', () => {
                const sourceNote = _currentlyViewedNoteData ? _currentlyViewedNoteData.finalNoteText : _currentFinalNoteContent;
                handleCopilotCopy(sourceNote);
            });
        }

        if (modalCopySaveBtn) {
            modalCopySaveBtn.addEventListener('click', async () => {
                _awaitingChecklistCompletionForCopySave = true;
                const saved = await saveCurrentNote();
                
                if (saved) {
                    const copied = await copyToClipboard(modalNoteTextarea.value);
                    if (copied) {
                        clearAllFormFields();
                        closeModal(true);
                        _lastNoteIdBeforeModalTransition = null;
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        if (banInput) {
                            banInput.focus();
                        }
                    }
                }
            });
        }

        if (separateNoteModalOverlay) separateNoteModalOverlay.addEventListener('click', (event) => {
            if (event.target === separateNoteModalOverlay) closeSeparateModal();
        });

        const separateModalCloseBtnBottom = get('separateModalCloseBtnBottom');
        if (separateModalCloseBtnBottom) separateModalCloseBtnBottom.addEventListener('click', closeSeparateModal);
        if (separateModalCloseBtn) separateModalCloseBtn.addEventListener('click', closeSeparateModal);

        if (separateModalCopySaveBtn) {
            separateModalCopySaveBtn.addEventListener('click', async () => {
                const sourceData = _currentlyViewedNoteData ? _currentlyViewedNoteData.formData : null;
                const noteToCopy = [
                    ..._buildSection1Content(sourceData),
                    ..._buildSection2InitialContent(sourceData),
                    ..._buildTroubleshootingProcessContent(sourceData),
                    ..._buildSection3Content(sourceData),
                    ..._buildSection4Content(sourceData)
                ].filter(line => line.trim() !== '').join('\n').trim();

                const copied = await copyToClipboard(noteToCopy);
                if (copied) {
                    const saved = await saveCurrentNote();
                    if (saved) {
                        clearAllFormFields();
                        closeSeparateModal();
                        closeModal(true);
                        _lastNoteIdBeforeModalTransition = null;
                    }
                }
            });
        }
        
        if (separateModalResolutionBtn) {
            modalResolutionBtn.addEventListener('click', () => {
                const sourceData = _currentlyViewedNoteData ? _currentlyViewedNoteData.formData : null;
                handleResolutionCopy(sourceData);
            });
        }

        document.querySelectorAll('.copy-separated-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const buttonElement = event.target.closest('.copy-separated-btn');
                if (!buttonElement) return;
                const targetInputId = buttonElement.dataset.target;
                const targetInput = get(targetInputId);
                if(targetInput) await copyToClipboard(targetInput.value);
            });
        });

        if (modalSeparateBtn) {
            modalSeparateBtn.addEventListener('click', () => {
                const sourceData = _currentlyViewedNoteData ? _currentlyViewedNoteData.formData : null;
                const finalNote = _currentlyViewedNoteData ? _currentlyViewedNoteData.finalNoteText : _currentFinalNoteContent;

                const part1CoreContent = _buildSection1Content(sourceData);
                const section2Content = _buildSection2InitialContent(sourceData);
                const tsContentArray = _buildTroubleshootingProcessContent(sourceData);
                const section3ContentArray = _buildSection3Content(sourceData);
                const section4ContentArray = _buildSection4Content(sourceData);

                const part1String = part1CoreContent.concat(section2Content).filter(line => line.trim() !== '').join('\n').trim();
                const tsString = tsContentArray.filter(line => line.trim() !== '').join('\n').trim();
                const section3String = section3ContentArray.filter(s => s).join('\n').trim();
                const section4String = section4ContentArray.filter(s => s).join('\n').trim();

                const troubleshootingProcessLength = _getFieldValue('troubleshootingProcessText', sourceData).length;

                const dynamicPartsContainer = separateNoteModalOverlay.querySelector('.modal-body.separate-notes-container');
                if (!dynamicPartsContainer) return;
                dynamicPartsContainer.innerHTML = '';

                let partsToDisplay = [];

                if (troubleshootingProcessLength > TS_PROCESS_THREE_PART_THRESHOLD) {
                    partsToDisplay.push({ label: 'Part 1', content: `1/3\n${part1String}` });
                    partsToDisplay.push({ label: 'Part 2', content: `2/3\n${tsString}` });
                    partsToDisplay.push({ label: 'Part 3', content: `3/3\n${section3String}\n${section4String}`.trim() });
                } else if (finalNote.length > TWO_PART_SPLIT_THRESHOLD) {
                    const part2CombinedString = [tsString, section3String, section4String].filter(s => s).join('\n').trim();
                    partsToDisplay.push({ label: 'Part 1', content: `1/2\n${part1String}` });
                    partsToDisplay.push({ label: 'Part 2', content: `2/2\n${part2CombinedString}` });
                } else {
                    partsToDisplay.push({ label: 'Full Note', content: finalNote });
                }

                partsToDisplay.forEach((partInfo, index) => {
                    if (partInfo.content.trim() === '') return;
                    const partDiv = document.createElement('div');
                    partDiv.classList.add('separated-note-part');
                    const textareaId = `dynamicSeparatedPart${index}`;
                    partDiv.innerHTML = `
                        <div class="separated-label-and-counter">
                            <label for="${textareaId}">${partInfo.label}</label>
                            <span class="char-counter" id="${textareaId}CharCount">0</span>
                        </div>
                        <textarea id="${textareaId}" rows="auto" readonly>${partInfo.content}</textarea>
                        <button type="button" class="modal-action-btn copy-btn-style copy-separated-btn" data-target="${textareaId}">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v2"/></svg>
                            COPY
                        </button>
                    `;
                    dynamicPartsContainer.appendChild(partDiv);
                    const partTextarea = get(textareaId);
                    const partCharCount = get(`${textareaId}CharCount`);
                    if (partTextarea && partCharCount) {
                        partTextarea.style.height = 'auto';
                        partTextarea.style.height = (partTextarea.scrollHeight) + 'px';
                        updateSeparatePartCharCounter(partTextarea, partCharCount);
                    }
                });

                dynamicPartsContainer.querySelectorAll('.copy-separated-btn').forEach(button => {
                    button.addEventListener('click', async (event) => {
                        const buttonElement = event.target.closest('.copy-separated-btn');
                        if (!buttonElement) return;
                        const targetInputId = buttonElement.dataset.target;
                        const targetInput = get(targetInputId);
                        if(targetInput) await copyToClipboard(targetInput.value);
                    });
                });

                closeModal(true);
                separateNoteModalOverlay.style.display = 'flex';
              iniciarTourSeparateModal(); // <--- AÑADE ESTA LÍNEA
            });
        }

        if (modalResolutionBtn) {
            modalResolutionBtn.addEventListener('click', () => {
                const sourceData = _currentlyViewedNoteData ? _currentlyViewedNoteData.formData : null;
                handleResolutionCopy(sourceData);
            });
        }

        if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', hideSidebar);
        if (historySidebarOverlay) historySidebarOverlay.addEventListener('click', hideSidebar);
        if (historySearchInput) historySearchInput.addEventListener('input', (event) => filterNotes(event.target.value));

        if (banInput) banInput.addEventListener('input', updateStickyHeaderInfo);
        if (cidInput) cidInput.addEventListener('input', updateStickyHeaderInfo);
        if (nameInput) nameInput.addEventListener('input', updateStickyHeaderInfo);
        if (cbrInput) cbrInput.addEventListener('input', updateStickyHeaderInfo);

        const stickyCopyButtons = document.querySelectorAll('.copy-button-sticky');
        if (stickyCopyButtons) {
            stickyCopyButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetId = button.getAttribute('data-target-id');
                    const targetElement = get(targetId);
                    if (targetElement) {
                        copyToClipboard(targetElement.value);
                    }
                });
            });
        }
        
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (noteModalOverlay && noteModalOverlay.style.display !== 'none') {
                    closeModal();
                }
                if (separateNoteModalOverlay && separateNoteModalOverlay.style.display !== 'none') {
                    closeSeparateModal();
                }
                if (historySidebar && historySidebar.classList.contains('open')) {
                    hideSidebar();
                }
                if (checklistSidebar && checklistSidebar.classList.contains('open')) {
                    closeChecklistSidebar();
                }
                if (customConfirmModal && customConfirmModal.style.display !== 'none') {
                    customConfirmModal.style.display = 'none';
                    if (resolveConfirmPromise) resolveConfirmPromise(false);
                }
                if (feedbackModalOverlay && feedbackModalOverlay.style.display !== 'none') {
                    feedbackModalOverlay.style.display = 'none';
                }
            }
        });

        if (feedbackBtn) {
            feedbackBtn.addEventListener('click', () => {
                if (feedbackModalOverlay) feedbackModalOverlay.style.display = 'flex';
            });
        }
        if (closeFeedbackModalBtn) {
            closeFeedbackModalBtn.addEventListener('click', () => {
                if (feedbackModalOverlay) feedbackModalOverlay.style.display = 'none';
            });
        }
        if (feedbackModalOverlay) {
            feedbackModalOverlay.addEventListener('click', (event) => {
                if (event.target === feedbackModalOverlay) {
                    feedbackModalOverlay.style.display = 'none';
                }
            });
        }
    };
    
    const initializeApp = async () => {
if (!localStorage.getItem('tutorialCompleted')) { document.querySelectorAll('.form-section').forEach(section => section.classList.add('collapsed')); }
        console.log('initializeApp: Starting initialization...');

        ['FFH CARE', 'FFH LOYALTY', 'FFH CAM - COLLECTIONS', 'C2F', 'SHS', 'MOB TS', 'MOB CARE', 'MOB LOYALTY', 'MOB CAM', 'wHSIA TS', 'SATELLITE TS', 'SMARTHOME CARE', 'SMARTHOME LOYALTY', 'SMARTHOME PLUS', 'ACQUISITIONS CARE', 'ACQUISITIONS TS', 'CUSTOM HOME CARE & MOVES', 'CUSTOM HOME LOYALTY', 'CUSTOM HOME TS'].forEach(optionText => {
            const option = document.createElement('option');
            option.value = optionText;
            option.textContent = optionText;
            if (transferSelect) transferSelect.appendChild(option);
        });

        populateExtraStepsSelect();
        updateThirdRowLayout();
        
        console.log('initializeApp: Calling initializeEventListeners...');
        initializeEventListeners();

        await handleWelcomeModal();
        initialResizeTextareas();

        if (affectedTextGroup) affectedTextGroup.style.display = 'none';
        if (serviceAffectedRow) serviceAffectedRow.classList.remove('has-affected');

        const initialPhysicalCheckListIds = ['physicalCheckList1Select', 'physicalCheckList2Select', 'physicalCheckList3Select', 'physicalCheckList4Select'];
        initialPhysicalCheckListIds.forEach(id => {
            const selectElement = get(id);
            if (selectElement) {
                selectElement.innerHTML = '<option value="">Select an option</option>';
                selectElement.disabled = true;
                selectElement.removeAttribute('required');
                if (id === 'physicalCheckList1Select' && physicalCheckList1Label) {
                    physicalCheckList1Label.textContent = fieldConfig[id].label;
                }
            } 
        });

        if (enablePhysicalCheck2) { enablePhysicalCheck2.checked = false; enablePhysicalCheck2.disabled = true; }
        if (enablePhysicalCheck3) { enablePhysicalCheck3.checked = false; enablePhysicalCheck3.disabled = true; }
        if (enablePhysicalCheck4) { enablePhysicalCheck4.checked = false; enablePhysicalCheck4.disabled = true; }
        if (physicalCheckListsContainer) physicalCheckListsContainer.classList.add('hidden-field');

        _populateAwaAlertsOptions('FFH');
        updateAwaAlerts2SelectState(false);
        updateAwaStepsSelectState('');

        if (enableAwaAlerts2) enableAwaAlerts2.checked = false;
        if (enableAwaAlerts2) enableAwaAlerts2.disabled = false;
        if (awaAlerts2Select) awaAlerts2Select.value = '';

        if (awaStepsSelect) awaStepsSelect.disabled = true;
        if (awaStepsSelect) awaStepsSelect.removeAttribute('required');

        updateTvsKeyFieldState();
        if (transferCheckbox) transferCheckbox.checked = false;
        updateTransferFieldState();
        updateTechFieldsVisibilityAndState('');
        populateTimeSlots("dispatch");
        
        resetChecklist();
        generateFinalNote();

        if (troubleshootingProcessText) updateTroubleshootingCharCounter(troubleshootingProcessText.value.length);
        await loadNotes();
        applyInitialRequiredHighlight();

        window.addEventListener('scroll', updateStickyHeaderInfo);
        updateStickyHeaderInfo();

        handleSkillChange();
        console.log('initializeApp: Initialization complete.');
    };

    const handleWelcomeModal = async () => {
        const agentNameSetting = await db.settings.get(AGENT_NAME_KEY);
        const modalBody = welcomeModalOverlay.querySelector('.modal-body');
        const modalHeader = welcomeModalOverlay.querySelector('.modal-header h3');
        let enterKeyHandler;

        const closeWelcomeModal = async () => {
            if (!agentNameSetting || !agentNameSetting.value) {
                const newAgentName = welcomeAgentNameInput.value.trim();
                if (newAgentName === '') {
                    showToast('Please enter your name to continue.', 'warning');
                    return;
                }
                agentNameInput.value = newAgentName;
                await saveAgentName();
            }
            welcomeModalOverlay.style.display = 'none';
            document.removeEventListener('keydown', enterKeyHandler);
        };

        enterKeyHandler = (event) => {
            if (event.key === 'Enter' && welcomeModalOverlay.style.display === 'flex') {
                event.preventDefault();
                closeWelcomeModal();
            }
        };

        if (agentNameSetting && agentNameSetting.value) {
            modalHeader.textContent = `Welcome back, ${agentNameSetting.value}`;
            modalBody.innerHTML = `<p>Ready to take more notes!</p>`;
            agentNameInput.value = agentNameSetting.value;
            setAgentNameReadonly();
        } else {
            modalHeader.textContent = 'Welcome to APad';
            const inputGroup = modalBody.querySelector('.input-group');
            if(inputGroup) inputGroup.style.display = 'block';
            const creatorP = modalBody.querySelector('p:nth-of-type(2)');
            if(creatorP) creatorP.innerHTML = '<strong>Creator:</strong> x331671 | Alex Van Houtven | FFH PureFiber TS';
        }

        welcomeModalOverlay.style.display = 'flex';
        document.addEventListener('keydown', enterKeyHandler);
        startTakingNotesBtn.addEventListener('click', closeWelcomeModal, { once: true });
    };

    const setChecklistValue = (radioName, value) => {
        const radioToSelect = document.querySelector(`input[name="${radioName}"][value="${value}"]`);
        if (radioToSelect) {
            if (!radioToSelect.checked) {
                radioToSelect.checked = true;
                radioToSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    };
    
    const clearChecklistValue = (radioName) => {
        const radios = document.querySelectorAll(`input[name="${radioName}"]`);
        let wasChanged = false;
        radios.forEach(radio => {
            if (radio.checked) {
                radio.checked = false;
                wasChanged = true;
            }
        });
        if (wasChanged) {
            const parentItem = radios[0].closest('.checklist-item');
            if (parentItem) {
                parentItem.classList.remove('status-yes', 'status-no', 'status-na', 'status-follow-up-yes', 'status-follow-up-no');
            }
        }
    };

    const resetChecklist = () => {
        const allRadios = checklistSidebar.querySelectorAll('.checklist-item input[type="radio"]');
        allRadios.forEach(radio => {
            radio.checked = false;
            const parentItem = radio.closest('.checklist-item');
            if (parentItem) {
                parentItem.classList.remove('status-yes', 'status-no', 'status-na', 'checklist-item-required', 'status-follow-up-yes', 'status-follow-up-no', 'status-pending');
            }
        });
        setChecklistValue('checklistCheckPhysical', 'no');
        setChecklistValue('checklistTsCopilot', 'no');
    };

    const updateChecklistState = () => {
        // Rule: CALLBACK NUMBER
        setChecklistValue('checklistCallbackNumber', _getFieldValue('cbr') ? 'yes' : 'no');

        // Rule: PROBING QUESTIONS & CORRECT INSIGHT WORKFLOW
        const issueSelected = _getFieldValue('issueSelect') !== '';
        setChecklistValue('checklistProbingQuestions', issueSelected ? 'yes' : 'no');
        setChecklistValue('checklistCorrectWorkflow', issueSelected ? 'yes' : 'no');

        // Rule: ADVANCED WIFI ANALYTICS
        const isFFH = !skillToggle.checked;
        const awaSelected = _getFieldValue('awaAlertsSelect') !== '';
        setChecklistValue('checklistAdvancedWifi', isFFH && awaSelected ? 'yes' : 'no');

        // Rule: TVS / ROUTE THIS
        const tvsYes = _getFieldValue('tvsSelect') === 'YES';
        const tvsKeyFilled = _getFieldValue('tvsKeyInput') !== '';
        setChecklistValue('checklistTvs', tvsYes && tvsKeyFilled ? 'yes' : 'no');
        
        // Rule: REBOOT / FACTORY RESET
        const tsText = _getFieldValue('troubleshootingProcessText').toLowerCase();
        const rebootKeywords = ['fr', 'hr', 'factory reset', 'hard reset', 'reboot'];
        if (rebootKeywords.some(keyword => tsText.includes(keyword))) {
            setChecklistValue('checklistReboot', 'yes');
        } else {
            setChecklistValue('checklistReboot', 'na');
        }

        // Rule: SWAP
        if (_getFieldValue('csrOrderInput')) {
            setChecklistValue('checklistSwap', 'yes');
        } else {
            setChecklistValue('checklistSwap', 'na');
        }

        // Rule: CALLBACK
        const resolvedValueForCallback = _getFieldValue('resolvedSelect');
        if (resolvedValueForCallback === 'Cx Need a Follow Up. Set SCB on FVA') {
            setChecklistValue('checklistCallback', 'yes');
        } else {
            setChecklistValue('checklistCallback', 'na');
        }

        // Rule: ALL SERVICES WORKING
        setChecklistValue('checklistAllServices', _getFieldValue('serviceOnCsr') === 'Active' ? 'yes' : 'no');

        // Rule: GO/SEND
        setChecklistValue('checklistGoSend', _getFieldValue('extraStepsSelect') !== '' ? 'yes' : 'no');

        // Rule: RECAP
        setChecklistValue('checklistRecap', 'no'); // Default to No

        // Rule: FOLLOW UP
        const resolvedValueForFollowUp = _getFieldValue('resolvedSelect');
        const followUpNeededValues = ['No | Follow Up Required', 'No | NC Ticket Created', 'No | BOSR Created'];
        if (followUpNeededValues.includes(resolvedValueForFollowUp)) {
            setChecklistValue('checklistFollowUp', 'yes');
        } else {
            setChecklistValue('checklistFollowUp', 'no');
        }
    };

    console.log('DOMContentLoaded: Initializing app...');
    initializeApp();
});

// =======================================================
//  PWA (PROGRESSIVE WEB APP) LOGIC
// =======================================================

const updateVersionInDOM = (version) => {
    if (!version) return;
    document.title = `APad | NoteApp - ${version}`;
    const appVersionDisplay = document.getElementById('appVersionDisplay');
    const welcomeAppVersionDisplay = document.getElementById('welcomeAppVersionDisplay');
    if (appVersionDisplay) {
        appVersionDisplay.textContent = version;
    }
    if (welcomeAppVersionDisplay) {
        welcomeAppVersionDisplay.textContent = version;
    }
};

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
                
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                console.log('New content is available, please refresh.');
                                showToast('A new version is available! Please close all tabs of this app and reopen to update.', 'info', 10000);
                            }
                        }
                    };
                };
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });

        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'APP_VERSION') {
                console.log('Version received from SW:', event.data.version);
                updateVersionInDOM(event.data.version);
                const db = new Dexie('tsNotesAppDB');
                db.settings.put({ key: 'appVersion', value: event.data.version });
            }
        });

        navigator.serviceWorker.ready.then(registration => {
            console.log('Service Worker is ready.');
            registration.active.postMessage({ type: 'GET_VERSION' });
        });

        const db = new Dexie('tsNotesAppDB');
        db.version(1).stores({ settings: 'key' });
        db.settings.get('appVersion').then(versionSetting => {
            if (versionSetting) {
                updateVersionInDOM(versionSetting.value);
            }
        });
    });
}
