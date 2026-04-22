frappe.pages["route-replay"].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({parent: wrapper, title: "Route Replay", single_column: true});
    var $bar = $('<div class="nt-filter-bar"></div>').appendTo(page.main);
    var $emp = $('<select class="form-control input-xs" style="max-width:220px"><option value="">-- Select Employee --</option></select>').appendTo($bar);
    var $date = $('<input type="date" class="form-control input-xs" style="max-width:140px">').appendTo($bar);
    var $load = $('<button class="btn btn-xs btn-primary" style="margin-left:8px">📍 Load Route</button>').appendTo($bar);
    var $controls = $('<div class="nt-filter-bar" style="border-top:none;padding-top:4px;display:none"></div>').appendTo(page.main);
    var $play = $('<button class="btn btn-xs btn-success">▶ Play</button>').appendTo($controls);
    var $pause = $('<button class="btn btn-xs btn-warning" style="margin-left:4px">⏸ Pause</button>').appendTo($controls);
    var $restart = $('<button class="btn btn-xs btn-default" style="margin-left:4px">⏮ Restart</button>').appendTo($controls);
    var $speed = $('<select class="form-control input-xs" style="max-width:80px;margin-left:8px"><option value="500">0.5x</option><option value="300" selected>1x</option><option value="150">2x</option><option value="75">4x</option></select>').appendTo($controls);
    var $info = $('<div style="padding:6px 16px;font-size:12px;color:var(--text-muted);display:none"></div>').appendTo(page.main);
    $('<div id="nt-replay-map" style="height:calc(100vh - 180px);width:100%;"></div>').appendTo(page.main);

    var map, polyline, marker, pings=[], timer, idx=0, playing=false;
    $date.val(frappe.datetime.get_today());

    // Load employees
    frappe.call({method:"nexus_tracker.nexus_tracker.api.shifts.get_admin_employees", callback:function(r){
        if(!r.message) return;
        r.message.forEach(function(emp){ $emp.append('<option value="'+emp.name+'">'+emp.employee_name+'</option>'); });
    }});

    function init_map(){
        if(map) return;
        map = L.map("nt-replay-map").setView([11.5886,43.1451],12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap"}).addTo(map);
    }

    function draw_route(data){
        init_map();
        pings = data.pings||[];
        var shift = data.shift, visits = data.visits||[];
        if(!pings.length){ frappe.msgprint("No GPS pings found for this date."); return; }
        if(polyline) map.removeLayer(polyline);
        if(marker) map.removeLayer(marker);
        var latlngs = pings.map(function(p){ return [parseFloat(p.latitude),parseFloat(p.longitude)]; });
        polyline = L.polyline(latlngs,{color:"#2490EF",weight:4,opacity:0.8}).addTo(map);
        // Start marker green
        L.circleMarker(latlngs[0],{radius:10,color:"green",fillColor:"green",fillOpacity:1}).addTo(map).bindPopup("🟢 Shift Start");
        // End marker red
        L.circleMarker(latlngs[latlngs.length-1],{radius:10,color:"red",fillColor:"red",fillOpacity:1}).addTo(map).bindPopup("🔴 Shift End");
        // Visit markers
        visits.forEach(function(v){
            L.circleMarker([parseFloat(v.latitude),parseFloat(v.longitude)],{radius:8,color:"orange",fillColor:"orange",fillOpacity:1}).addTo(map).bindPopup("🏢 "+v.client+"<br>In: "+v.checked_in_at+"<br>Out: "+(v.checked_out_at||"Active"));
        });
        map.fitBounds(polyline.getBounds(),{padding:[30,30]});
        var icon = L.divIcon({html:'<div style="background:#2490EF;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">👤</div>',iconSize:[36,36],iconAnchor:[18,18],className:""});
        marker = L.marker(latlngs[0],{icon:icon}).addTo(map);
        idx=0; playing=false;
        $controls.show();
        if(shift){
            $info.show().html("👤 Employee | 📅 "+shift.date+" | ⏱ Start: "+(shift.started_at||"-")+" | End: "+(shift.ended_at||"Active")+" | 🛣 "+(parseFloat(shift.total_km||0)).toFixed(2)+" km | 📍 "+pings.length+" pings | 🏢 "+visits.length+" visits");
        }
    }

    $load.click(function(){
        var emp=$emp.val(), date=$date.val();
        if(!emp||!date){ frappe.msgprint("Please select employee and date."); return; }
        $load.text("Loading...").prop("disabled",true);
        frappe.call({
            method:"nexus_tracker.nexus_tracker.api.shifts.get_employee_route",
            args:{employee:emp, date:date},
            callback:function(r){
                $load.text("📍 Load Route").prop("disabled",false);
                if(!r.message) return;
                if(!window.L){
                    $('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">').appendTo("head");
                    $.getScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",function(){ draw_route(r.message); });
                } else { draw_route(r.message); }
            }
        });
    });

    function step(){
        if(!playing||idx>=pings.length){ playing=false; return; }
        var p=pings[idx];
        marker.setLatLng([parseFloat(p.latitude),parseFloat(p.longitude)]);
        marker.bindPopup("📍 Ping "+(idx+1)+"/"+pings.length+"<br>🔋"+(p.battery_level||"?")+"% | "+p.recorded_at).openPopup();
        idx++;
        timer=setTimeout(step,parseInt($speed.val()));
    }

    $play.click(function(){ if(pings.length){ playing=true; step(); } });
    $pause.click(function(){ playing=false; clearTimeout(timer); });
    $restart.click(function(){ playing=false; clearTimeout(timer); idx=0; if(pings.length) marker.setLatLng([parseFloat(pings[0].latitude),parseFloat(pings[0].longitude)]); });
};