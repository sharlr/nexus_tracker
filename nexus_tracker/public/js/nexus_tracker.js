/* NEXUS RAJAN - TRACKER PRO — Common JS
   © Copyright NEXUS RAJAN 2026 DJIBOUTI */
window.NT = window.NT || {};
NT.COPYRIGHT = '\u00A9 Copyright NEXUS RAJAN 2026 DJIBOUTI';
NT.lang = localStorage.getItem('nt_lang') || 'en';

NT.translations = {
    en: {
        live_map: 'Live Map', route_replay: 'Route Replay',
        tasks: 'Tasks', employees: 'Employees', clients: 'Clients',
        alerts: 'Alerts', reports: 'Reports', save: 'Save', cancel: 'Cancel',
        employee: 'Employee', branch: 'Branch', department: 'Department',
        territory: 'Territory', date: 'Date', export_pdf: 'Export PDF',
        export_csv: 'Export CSV', load_route: 'Load Route',
        play: 'Play', pause: 'Pause', restart: 'Restart', speed: 'Speed',
        shift_start: 'Shift Start', shift_end: 'Shift End', distance: 'Distance',
        working_time: 'Working Time', stops: 'Stops', visits: 'Client Visits',
        mark_all_read: 'Mark all read', new_task: 'New Task',
        assign_task: 'Assign Task', complete: 'Complete',
        gps_off: 'GPS Off', low_battery: 'Low Battery',
        geofence: 'Geofence', inactivity: 'Inactivity',
        active: 'Active', idle: 'Idle', offline: 'Offline',
    },
    fr: {
        live_map: 'Carte en direct', route_replay: 'Replay d\'itin\u00e9raire',
        tasks: 'T\u00e2ches', employees: 'Employ\u00e9s', clients: 'Clients',
        alerts: 'Alertes', reports: 'Rapports', save: 'Enregistrer', cancel: 'Annuler',
        employee: 'Employ\u00e9', branch: 'Branche', department: 'D\u00e9partement',
        territory: 'Territoire', date: 'Date', export_pdf: 'Exporter PDF',
        export_csv: 'Exporter CSV', load_route: 'Charger l\'itin\u00e9raire',
        play: 'Lecture', pause: 'Pause', restart: 'Red\u00e9marrer', speed: 'Vitesse',
        shift_start: 'D\u00e9but du quart', shift_end: 'Fin du quart', distance: 'Distance',
        working_time: 'Temps de travail', stops: 'Arr\u00eats', visits: 'Visites clients',
        mark_all_read: 'Tout marquer comme lu', new_task: 'Nouvelle t\u00e2che',
        assign_task: 'Assigner t\u00e2che', complete: 'Terminer',
        gps_off: 'GPS \u00e9teint', low_battery: 'Batterie faible',
        geofence: 'G\u00e9ocl\u00f4ture', inactivity: 'Inactivit\u00e9',
        active: 'Actif', idle: 'Inactif', offline: 'Hors ligne',
    },
    it: {
        live_map: 'Mappa in tempo reale', route_replay: 'Replay del percorso',
        tasks: 'Attivit\u00e0', employees: 'Dipendenti', clients: 'Clienti',
        alerts: 'Avvisi', reports: 'Report', save: 'Salva', cancel: 'Annulla',
        employee: 'Dipendente', branch: 'Filiale', department: 'Dipartimento',
        territory: 'Territorio', date: 'Data', export_pdf: 'Esporta PDF',
        export_csv: 'Esporta CSV', load_route: 'Carica percorso',
        play: 'Riproduci', pause: 'Pausa', restart: 'Riavvia', speed: 'Velocit\u00e0',
        shift_start: 'Inizio turno', shift_end: 'Fine turno', distance: 'Distanza',
        working_time: 'Tempo lavorato', stops: 'Soste', visits: 'Visite clienti',
        mark_all_read: 'Segna tutti come letti', new_task: 'Nuova attivit\u00e0',
        assign_task: 'Assegna attivit\u00e0', complete: 'Completa',
        gps_off: 'GPS spento', low_battery: 'Batteria scarica',
        geofence: 'Geofence', inactivity: 'Inattivit\u00e0',
        active: 'Attivo', idle: 'Inattivo', offline: 'Offline',
    }
};

NT.t = function(key) {
    var t = NT.translations[NT.lang];
    return (t && t[key]) || NT.translations.en[key] || key;
};

NT.set_lang = function(lang) {
    localStorage.setItem('nt_lang', lang);
    NT.lang = lang;
    frappe.msgprint('Language changed to ' + lang.toUpperCase() + '. Refreshing...');
    setTimeout(function(){ location.reload(); }, 800);
};

NT.lang_switcher = function() {
    var $d = $('<div>').css({display:'flex',gap:'4px',alignItems:'center'});
    ['EN','FR','IT'].forEach(function(l) {
        var active = NT.lang === l.toLowerCase();
        $('<button>').addClass('btn btn-xs ' + (active ? 'btn-primary' : 'btn-default'))
            .text(l).click(function(){ NT.set_lang(l.toLowerCase()); }).appendTo($d);
    });
    return $d;
};

NT.copyright_footer = function(parent) {
    $(parent).append($('<div>').css({padding:'6px 16px',fontSize:'10px',
        color:'var(--text-muted)',textAlign:'center',borderTop:'1px solid var(--border-color)'})
        .text(NT.COPYRIGHT));
};
