/* NEXUS RAJAN - TRACKER PRO — Route Replay (FieldSense-style animation)
   © Copyright NEXUS RAJAN 2026 DJIBOUTI */
frappe.pages['route-replay'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({parent:wrapper,title:__('Route Replay'),single_column:true});
    if (!document.getElementById('nt-leaflet-css')) {
        var l=document.createElement('link');l.id='nt-leaflet-css';l.rel='stylesheet';
        l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(l);
    }
    var load=function(cb){if(window.L){cb();return;}var s=document.createElement('script');
        s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=cb;document.head.appendChild(s);};
    load(function(){ init_replay(page,wrapper); });
};

function init_replay(page,wrapper) {
    var $ = frappe.require ? window.$ : window.$;
    var $body=$(wrapper).find('.page-content');
    $body.empty().css({display:'flex',flexDirection:'column',height:'calc(100vh - 60px)'});
    var COPYRIGHT='\u00A9 Copyright NEXUS RAJAN 2026 DJIBOUTI';

    /* ── Filter bar (single row, multiple columns) ── */
    var $fbar=$('<div>').css({display:'flex',gap:'8px',padding:'8px 16px',
        background:'var(--control-bg)',borderBottom:'1px solid var(--border-color)',
        alignItems:'center',flexShrink:0,flexWrap:'nowrap'});
    var $emp_sel=$('<select>').addClass('form-control form-control-sm').css({maxWidth:'180px'})
        .append($('<option>').val('').text('-- Employee --'));
    var $date=$('<input type="date">').addClass('form-control form-control-sm').css({maxWidth:'140px'})
        .val(frappe.datetime.get_today());
    var $branch=$('<select>').addClass('form-control form-control-sm').css({maxWidth:'130px'})
        .append($('<option>').val('').text('-- Branch --'));
    var $dept=$('<select>').addClass('form-control form-control-sm').css({maxWidth:'140px'})
        .append($('<option>').val('').text('-- Dept --'));
    var $load_btn=$('<button>').addClass('btn btn-sm btn-primary').text('Load Route');
    $fbar.append($emp_sel,$date,$branch,$dept,$load_btn);
    $body.append($fbar);

    frappe.call({method:'frappe.client.get_list',
        args:{doctype:'FT Employee',fields:['name','employee_name'],limit_page_length:200},
        callback:function(r){if(r.message)r.message.forEach(function(e){
            $emp_sel.append($('<option>').val(e.name).text(e.employee_name));});}});

    /* ── Main area: map + stats panel ── */
    var $main=$('<div>').css({display:'flex',gap:'12px',padding:'12px',flex:1,minHeight:0});
    $body.append($main);

    var $map_wrap=$('<div>').css({flex:1,display:'flex',flexDirection:'column',gap:'8px'});
    $main.append($map_wrap);

    var $map_el=$('<div>').css({flex:1,borderRadius:'8px',border:'1px solid var(--border-color)',minHeight:'360px'});
    $map_wrap.append($map_el);

    /* Animation controls */
    var $ctrl=$('<div>').css({display:'flex',alignItems:'center',gap:'10px',
        padding:'8px 12px',background:'var(--card-bg)',border:'1px solid var(--border-color)',
        borderRadius:'8px',flexShrink:0});
    var $play=$('<button>').addClass('btn btn-sm btn-primary').html('&#9654; Play');
    var $pause=$('<button>').addClass('btn btn-sm').html('&#9646;&#9646; Pause').prop('disabled',true);
    var $restart=$('<button>').addClass('btn btn-sm').text('&#8635; Restart');
    var $speed_lbl=$('<span>').css({fontSize:'11px',color:'var(--text-muted)',marginLeft:'8px'}).text('Speed:');
    var speed=1,speeds=[1,2,4,8];
    var $speed_btns=speeds.map(function(s){
        return $('<button>').addClass('btn btn-xs '+(s===1?'btn-primary':'btn-default')).text(s+'x')
            .click(function(){speed=s;$speed_btns.forEach(function(b,i){
                b.removeClass('btn-primary btn-default').addClass(speeds[i]===s?'btn-primary':'btn-default');});});
    });
    var $timeline=$('<input type="range">').css({flex:1}).attr({min:0,max:100,value:0});
    var $time_lbl=$('<span>').css({fontSize:'11px',color:'var(--text-muted)',minWidth:'60px'}).text('0:00');
    $ctrl.append($play,$pause,$restart,$speed_lbl,...$speed_btns,$timeline,$time_lbl);
    $map_wrap.append($ctrl);

    /* Stats panel */
    var $panel=$('<div>').css({width:'220px',flexShrink:0,background:'var(--card-bg)',
        border:'1px solid var(--border-color)',borderRadius:'8px',padding:'12px',
        display:'flex',flexDirection:'column',gap:'12px',overflowY:'auto'});
    $main.append($panel);
    $('<div>').css({fontSize:'10px',fontWeight:'700',color:'var(--text-muted)',letterSpacing:'.5px'})
        .text('ROUTE STATS').appendTo($panel);

    var stat_vals={};
    var stat_defs=[
        ['start','Shift Start','--:--'],['end','Shift End','--:--'],
        ['current','Current Time','--:--'],['km','Distance','0 km'],
        ['hours','Working Time','0h 0m'],['stops','Stops','0'],['visits','Client Visits','0']];
    stat_defs.forEach(function(d){
        var $row=$('<div>').css({borderBottom:'1px solid var(--border-color)',paddingBottom:'8px'});
        $('<div>').css({fontSize:'10px',color:'var(--text-muted)'}).text(d[1]).appendTo($row);
        var $val=$('<div>').css({fontSize:'13px',fontWeight:'600',color:'var(--text-color)'}).text(d[2]);
        $val.appendTo($row);$panel.append($row);stat_vals[d[0]]=$val;
    });
    var $stop_list=$('<div>').css({fontSize:'11px'});
    $('<div>').css({fontSize:'10px',fontWeight:'700',color:'var(--text-muted)',letterSpacing:'.5px',marginTop:'4px'})
        .text('STOPS').appendTo($panel);
    $panel.append($stop_list);
    $('<div>').css({marginTop:'auto',fontSize:'9px',color:'var(--text-muted)',textAlign:'center',paddingTop:'8px',
        borderTop:'1px solid var(--border-color)'}).text(COPYRIGHT).appendTo($panel);

    /* ── Map init ── */
    var map=L.map($map_el[0]).setView([11.8251,42.5903],13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'&copy; OpenStreetMap',maxZoom:19}).addTo(map);

    var pings=[],visits=[],polyline=null,start_marker=null,end_marker=null;
    var visit_markers=[],anim_marker=null,anim_idx=0,anim_timer=null,playing=false;

    var startIcon=L.divIcon({className:'',iconSize:[22,22],iconAnchor:[11,11],
        html:'<div style="background:#28A745;width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>'});
    var endIcon=L.divIcon({className:'',iconSize:[22,22],iconAnchor:[11,11],
        html:'<div style="background:#E74C3C;width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>'});
    var visitIcon=L.divIcon({className:'',iconSize:[16,16],iconAnchor:[8,8],
        html:'<div style="background:#F39C12;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>'});

    function fmt_time(dt){if(!dt)return'--:--';var d=new Date(dt);
        return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}
    function fmt_mins(m){return Math.floor(m/60)+'h '+((m%60)||0)+'m';}

    function clear_map(){
        if(polyline)map.removeLayer(polyline);polyline=null;
        if(start_marker)map.removeLayer(start_marker);start_marker=null;
        if(end_marker)map.removeLayer(end_marker);end_marker=null;
        if(anim_marker)map.removeLayer(anim_marker);anim_marker=null;
        visit_markers.forEach(function(m){map.removeLayer(m);});visit_markers=[];
        $stop_list.empty();
    }

    function draw_route(data){
        clear_map();stop_anim();
        pings=data.pings||[];visits=data.visits||[];
        var shift=data.shift;
        if(!pings.length){frappe.msgprint('No GPS data for this employee on this date.');return;}
        var latlngs=pings.map(function(p){return[parseFloat(p.latitude),parseFloat(p.longitude)];});
        polyline=L.polyline(latlngs,{color:'#2490EF',weight:3,opacity:.8}).addTo(map);
        map.fitBounds(polyline.getBounds(),{padding:[40,40]});
        start_marker=L.marker(latlngs[0],{icon:startIcon}).addTo(map)
            .bindPopup('Start: '+fmt_time(pings[0].recorded_at));
        end_marker=L.marker(latlngs[latlngs.length-1],{icon:endIcon}).addTo(map)
            .bindPopup('End: '+fmt_time(pings[pings.length-1].recorded_at));
        visits.forEach(function(v){
            if(!v.latitude||!v.longitude)return;
            var m=L.marker([parseFloat(v.latitude),parseFloat(v.longitude)],{icon:visitIcon}).addTo(map)
                .bindPopup('<b>'+(v.client||'Client')+'</b><br>'+fmt_time(v.checked_in_at)+' – '+fmt_time(v.checked_out_at)+'<br>Rating: '+(v.rating||'-')+'/5');
            visit_markers.push(m);
        });
        // Anim marker
        anim_marker=L.marker(latlngs[0],{icon:L.divIcon({className:'',iconSize:[34,34],iconAnchor:[17,17],
            html:'<div style="background:#2490EF;width:34px;height:34px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700">&#9654;</div>'
        })}).addTo(map);
        // Stats
        if(shift){
            stat_vals.start.text(fmt_time(shift.started_at));
            stat_vals.end.text(shift.is_active?'Active':fmt_time(shift.ended_at));
            stat_vals.km.text((parseFloat(shift.total_km)||0).toFixed(1)+' km');
            stat_vals.hours.text(fmt_mins(shift.total_minutes||0));
        }
        stat_vals.stops.text(pings.length);
        stat_vals.visits.text(visits.length);
        $timeline.attr('max',pings.length-1).val(0);
        // Stop list
        $stop_list.empty();
        pings.slice(0,8).forEach(function(p,i){
            var $row=$('<div>').css({display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'});
            $('<div>').css({width:'8px',height:'8px',borderRadius:'50%',flexShrink:0,
                background:'#2490EF'}).appendTo($row);
            $('<div>').css({fontSize:'10px',color:'var(--text-muted)',minWidth:'40px'}).text(fmt_time(p.recorded_at)).appendTo($row);
            $('<div>').css({fontSize:'10px',color:'var(--text-color)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'})
                .text((parseFloat(p.latitude)||0).toFixed(4)+', '+(parseFloat(p.longitude)||0).toFixed(4)).appendTo($row);
            $stop_list.append($row);
        });
        if(pings.length>8)$stop_list.append($('<div>').css({fontSize:'10px',color:'var(--text-muted)'}).text('... and '+(pings.length-8)+' more stops'));
    }

    /* Animation */
    function stop_anim(){
        if(anim_timer)clearInterval(anim_timer);anim_timer=null;playing=false;
        $play.prop('disabled',false);$pause.prop('disabled',true);}

    function start_anim(){
        if(!pings.length)return;
        playing=true;$play.prop('disabled',true);$pause.prop('disabled',false);
        anim_timer=setInterval(function(){
            anim_idx+=speed;
            if(anim_idx>=pings.length){anim_idx=pings.length-1;stop_anim();return;}
            var p=pings[anim_idx];
            var latlng=[parseFloat(p.latitude),parseFloat(p.longitude)];
            if(anim_marker)anim_marker.setLatLng(latlng);
            map.panTo(latlng,{animate:true,duration:0.3});
            $timeline.val(anim_idx);
            stat_vals.current.text(fmt_time(p.recorded_at));
            // Update partial polyline
            var drawn=pings.slice(0,anim_idx+1).map(function(pp){return[parseFloat(pp.latitude),parseFloat(pp.longitude)];});
            if(polyline)polyline.setLatLngs(drawn);
        },200);
    }

    $play.click(function(){if(!playing)start_anim();});
    $pause.click(function(){stop_anim();});
    $restart.click(function(){stop_anim();anim_idx=0;if(pings.length)anim_marker.setLatLng([parseFloat(pings[0].latitude),parseFloat(pings[0].longitude)]);draw_route({pings:pings,visits:visits,shift:null});});
    $timeline.on('input',function(){
        stop_anim();anim_idx=parseInt($(this).val());
        if(pings[anim_idx]&&anim_marker)anim_marker.setLatLng([parseFloat(pings[anim_idx].latitude),parseFloat(pings[anim_idx].longitude)]);
        stat_vals.current.text(fmt_time(pings[anim_idx]&&pings[anim_idx].recorded_at));
    });

    $load_btn.click(function(){
        var emp=$emp_sel.val(),date=$date.val();
        if(!emp||!date){frappe.msgprint('Please select an employee and date.');return;}
        $load_btn.prop('disabled',true).text('Loading...');
        frappe.call({method:'nexus_tracker.nexus_tracker.api.shifts.get_employee_route',
            args:{employee:emp,date:date},
            callback:function(r){
                $load_btn.prop('disabled',false).text('Load Route');
                if(r.message)draw_route(r.message);
            }
        });
    });

    // Copyright footer
    $('<div>').css({padding:'6px 16px',fontSize:'10px',color:'var(--text-muted)',textAlign:'center',
        borderTop:'1px solid var(--border-color)',flexShrink:0}).text(COPYRIGHT).appendTo($body);
}
