/* NEXUS RAJAN - TRACKER PRO — Live Map Page
   © Copyright NEXUS RAJAN 2026 DJIBOUTI */
frappe.pages['live-map'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper, title: __('Live Map'), single_column: true
    });
    // Inject Leaflet CSS
    if (!document.getElementById('nt-leaflet-css')) {
        var l = document.createElement('link');
        l.id='nt-leaflet-css'; l.rel='stylesheet';
        l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(l);
    }
    var loadLeaflet = function(cb) {
        if (window.L) { cb(); return; }
        var s=document.createElement('script');
        s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.onload=cb; document.head.appendChild(s);
    };
    loadLeaflet(function() { init_live_map(page, wrapper); });
};

function init_live_map(page, wrapper) {
    var $body = $(wrapper).find('.page-content');
    $body.empty();
    // Language toggle
    var lang = localStorage.getItem('nt_lang') || 'en';
    var $lang_row = $('<div>').css({display:'flex',gap:'6px',padding:'8px 16px',
        borderBottom:'1px solid var(--border-color)',alignItems:'center',background:'var(--card-bg)'});
    var copyright_text = '\u00A9 Copyright NEXUS RAJAN 2026 DJIBOUTI';
    $lang_row.append($('<span>').css({fontSize:'11px',color:'var(--text-muted)',marginRight:'auto'}).text(copyright_text));
    ['EN','FR','IT'].forEach(function(l) {
        var $btn = $('<button>').addClass('btn btn-xs').text(l)
            .css({fontWeight: l.toLowerCase()===lang ? '700':'400'})
            .click(function() {
                localStorage.setItem('nt_lang', l.toLowerCase());
                frappe.msgprint(__('Language changed. Refreshing...'));
                setTimeout(function(){ location.reload(); },800);
            });
        $lang_row.append($btn);
    });
    $body.append($lang_row);

    // Filter bar - SINGLE ROW with multiple columns
    var $filter = $('<div>').css({display:'flex',gap:'8px',padding:'8px 16px',
        background:'var(--control-bg)',borderBottom:'1px solid var(--border-color)',flexWrap:'nowrap'});
    var filters = {};
    [
        ['employee','Employee / Employé / Dipendente','FT Employee','employee_name'],
        ['branch','Branch / Branche / Filiale','Branch','name'],
        ['department','Dept / Dép. / Dip.','Department','name'],
        ['territory','Territory / Territoire / Territorio','Territory','name'],
    ].forEach(function(f) {
        var $sel = $('<select>').addClass('form-control form-control-sm')
            .css({fontSize:'11px',maxWidth:'160px'})
            .append($('<option>').val('').text('-- '+f[1]+' --'));
        frappe.call({method:'frappe.client.get_list',
            args:{doctype:f[2],fields:['name',f[3]],limit_page_length:100},
            callback:function(r) {
                if(r.message) r.message.forEach(function(o){
                    $sel.append($('<option>').val(o.name).text(o[f[3]]||o.name));
                });
            }
        });
        $sel.on('change',function(){ filters[f[0]]=$(this).val(); refresh_map(); });
        $filter.append($('<div>').css({display:'flex',flexDirection:'column',flex:'1'})
            .append($sel));
    });
    $body.append($filter);

    // Layout: map + right panel
    var $main = $('<div>').css({display:'flex',gap:'12px',padding:'12px',
        height:'calc(100vh - 180px)'});
    $body.append($main);

    var $map_el = $('<div>').css({flex:'1',borderRadius:'8px',
        border:'1px solid var(--border-color)',minHeight:'400px'});
    $main.append($map_el);

    var $panel = $('<div>').css({width:'240px',flexShrink:'0',
        background:'var(--card-bg)',border:'1px solid var(--border-color)',
        borderRadius:'8px',overflow:'hidden',display:'flex',flexDirection:'column'});
    $main.append($panel);

    $panel.append($('<div>').css({padding:'10px 14px',borderBottom:'1px solid var(--border-color)',
        fontSize:'11px',fontWeight:'600',color:'var(--text-muted)'}).text('FIELD EMPLOYEES'));
    var $list = $('<div>').css({flex:'1',overflowY:'auto',padding:'8px'});
    $panel.append($list);

    var map = L.map($map_el[0]).setView([11.8251, 42.5903], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom:19
    }).addTo(map);

    var markers = {};

    function make_icon(name, online) {
        var color = online ? '#28A745' : '#8D99A6';
        var initials = (name||'?').split(' ').map(function(n){return n[0];}).join('').slice(0,2).toUpperCase();
        return L.divIcon({className:'',iconSize:[38,38],iconAnchor:[19,19],
            html:'<div style="background:'+color+';width:38px;height:38px;border-radius:50%;'+
                'border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);'+
                'display:flex;align-items:center;justify-content:center;'+
                'color:white;font-weight:700;font-size:12px;font-family:sans-serif;">'+initials+'</div>'
        });
    }

    function refresh_map() {
        frappe.call({
            method:'nexus_tracker.nexus_tracker.api.shifts.get_admin_employees',
            args: filters,
            callback: function(r) {
                if (!r.message) return;
                $list.empty();
                r.message.forEach(function(emp) {
                    var ping = emp.last_ping;
                    var online = ping && ping.gps_enabled;
                    var lat = ping ? parseFloat(ping.latitude) : null;
                    var lng = ping ? parseFloat(ping.longitude) : null;
                    if (lat && lng) {
                        if (markers[emp.name]) {
                            markers[emp.name].setLatLng([lat,lng]);
                            markers[emp.name].setIcon(make_icon(emp.employee_name, online));
                        } else {
                            var m = L.marker([lat,lng],{icon:make_icon(emp.employee_name,online)}).addTo(map);
                            m.bindPopup(
                                '<b>'+emp.employee_name+'</b><br>'+
                                (ping ? 'Battery: '+(ping.battery_level||'?')+'%<br>GPS: '+(ping.gps_enabled?'ON':'OFF')+'<br>Network: '+(ping.network_type||'?')+'<br>Phone: '+(ping.phone_model||'?') : 'No ping yet')+
                                '<br><a href="/app/nexus-tracker-task/new" class="btn btn-xs btn-primary" style="margin-top:6px">Assign Task</a>'
                            );
                            markers[emp.name]=m;
                        }
                    }
                    // Employee list item
                    var color = online ? '#28A745' : (ping && !ping.gps_enabled ? '#E74C3C' : '#8D99A6');
                    var status = online ? 'Active' : (ping && !ping.gps_enabled ? 'GPS Off' : 'Offline');
                    var $item = $('<div>').css({display:'flex',alignItems:'center',gap:'8px',
                        padding:'6px 8px',borderRadius:'6px',marginBottom:'4px',cursor:'pointer'})
                        .hover(function(){$(this).css('background','var(--control-bg)')},
                               function(){$(this).css('background','transparent')});
                    $('<div>').css({width:'26px',height:'26px',borderRadius:'50%',flexShrink:'0',
                        background:color,display:'flex',alignItems:'center',justifyContent:'center',
                        color:'white',fontSize:'10px',fontWeight:'700'})
                        .text((emp.employee_name||'?').split(' ').map(function(n){return n[0];}).join('').slice(0,2).toUpperCase())
                        .appendTo($item);
                    var $info=$('<div>').css({flex:'1',overflow:'hidden'});
                    $('<div>').css({fontSize:'11px',fontWeight:'500',color:'var(--text-color)',
                        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}).text(emp.employee_name).appendTo($info);
                    $('<div>').css({fontSize:'10px',color:color}).text(status).appendTo($info);
                    $item.append($info);
                    $item.click(function(){ if(markers[emp.name]) map.panTo(markers[emp.name].getLatLng()); });
                    $list.append($item);
                });
            }
        });
    }

    // Real-time via socket.io
    frappe.realtime.on('live_position', function(data) {
        if (!data.latitude || !data.longitude) return;
        var lat=parseFloat(data.latitude), lng=parseFloat(data.longitude);
        if (markers[data.employee]) {
            markers[data.employee].setLatLng([lat,lng]);
        } else {
            markers[data.employee]=L.marker([lat,lng],{icon:make_icon(data.employee_name,true)}).addTo(map);
        }
    });

    refresh_map();
    setInterval(refresh_map, 30000);

    // Copyright footer
    $('<div>').css({padding:'6px 16px',fontSize:'10px',color:'var(--text-muted)',
        textAlign:'center',borderTop:'1px solid var(--border-color)'})
        .text(copyright_text).appendTo($body);
}
