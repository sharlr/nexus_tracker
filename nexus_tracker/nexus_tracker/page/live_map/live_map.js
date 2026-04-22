frappe.pages["live-map"].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({parent: wrapper, title: "Live Map", single_column: true});
    var $bar = $('<div class="nt-filter-bar"></div>').appendTo(page.main);
    var $emp_sel = $('<select class="form-control input-xs" style="max-width:220px"><option value="">-- All Employees --</option></select>').appendTo($bar);
    var $refresh = $('<button class="btn btn-xs btn-primary" style="margin-left:8px">🔄 Refresh</button>').appendTo($bar);
    var $status = $('<span style="margin-left:12px;font-size:11px;color:var(--text-muted)"></span>').appendTo($bar);
    $('<div id="nt-live-map" style="height:calc(100vh - 130px);width:100%;"></div>').appendTo(page.main);
    var map, markers = {};

    frappe.call({method:"nexus_tracker.nexus_tracker.api.shifts.get_admin_employees", callback:function(r){
        if(!r.message) return;
        r.message.forEach(function(emp){ $emp_sel.append('<option value="'+emp.name+'">'+emp.employee_name+'</option>'); });
    }});

    function init_map(){
        if(map) return;
        map = L.map("nt-live-map").setView([11.5886,43.1451],12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap"}).addTo(map);
    }

    function load_employees(){
        $status.text("Loading...");
        frappe.call({method:"nexus_tracker.nexus_tracker.api.shifts.get_admin_employees",
            args:{employee:$emp_sel.val()||null},
            callback:function(r){
                if(!r.message) return;
                init_map();
                var bounds=[], count=0;
                r.message.forEach(function(emp){
                    if(!emp.last_ping) return;
                    var lp=emp.last_ping;
                    var lat=parseFloat(lp.latitude), lng=parseFloat(lp.longitude);
                    if(isNaN(lat)||isNaN(lng)) return;
                    count++;
                    bounds.push([lat,lng]);
                    var popup="<b>"+emp.employee_name+"</b><br>🔋 "+(lp.battery_level||"?")+"% | GPS: "+(lp.gps_enabled?"🟢":"🔴")+"<br>📱"+(lp.phone_model||"")+"<br>🕐"+(lp.recorded_at||"");
                    var icon=L.divIcon({html:'<div style="background:#2490EF;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">👤</div>',iconSize:[36,36],iconAnchor:[18,18],className:""});
                    if(markers[emp.name]){ markers[emp.name].setLatLng([lat,lng]).setPopupContent(popup); }
                    else { markers[emp.name]=L.marker([lat,lng],{icon:icon}).addTo(map).bindPopup(popup); }
                });
                if(bounds.length) map.fitBounds(bounds,{padding:[40,40]});
                $status.text("✅ "+count+" active | "+frappe.datetime.now_time());
            }
        });
    }

    function boot(){
        if(!window.L){
            $('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">').appendTo("head");
            $.getScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",load_employees);
        } else { load_employees(); }
    }
    boot();
    $refresh.click(load_employees);
    setInterval(load_employees,30000);
    frappe.realtime.on("live_position",function(data){
        if(!map) return;
        var lat=parseFloat(data.latitude), lng=parseFloat(data.longitude);
        if(isNaN(lat)||isNaN(lng)) return;
        var popup="<b>"+(data.employee_name||data.employee)+"</b><br>🔋"+(data.battery_level||"?")+"% | Just now";
        if(markers[data.employee]){ markers[data.employee].setLatLng([lat,lng]).setPopupContent(popup); }
        else { markers[data.employee]=L.marker([lat,lng]).addTo(map).bindPopup(popup); }
        $status.text("✅ Live update | "+frappe.datetime.now_time());
    });
};