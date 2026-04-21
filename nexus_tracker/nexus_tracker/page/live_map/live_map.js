frappe.pages["live-map"].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __("Live Map"),
        single_column: true,
    });

    // Filter bar
    var $bar = $('<div class="nt-filter-bar"></div>').appendTo(page.main);
    var $emp_sel = $('<select class="form-control input-xs"><option value="">-- All Employees --</option></select>').appendTo($bar);
    var $refresh = $('<button class="btn btn-xs btn-primary" style="margin-left:8px">Refresh</button>').appendTo($bar);

    // Map container
    var $map_div = $('<div id="nt-live-map" style="height:calc(100vh - 160px);width:100%;"></div>').appendTo(page.main);

    var map, markers = {};

    function init_map() {
        if (map) return;
        map = L.map("nt-live-map").setView([0, 0], 4);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors"
        }).addTo(map);
    }

    function load_employees() {
        frappe.call({
            method: "nexus_tracker.nexus_tracker.api.shifts.get_admin_employees",
            args: { employee: $emp_sel.val() || null },
            callback: function (r) {
                if (!r.message) return;
                init_map();
                var bounds = [];
                r.message.forEach(function (emp) {
                    if (!emp.last_ping) return;
                    var lp = emp.last_ping;
                    var lat = parseFloat(lp.latitude), lng = parseFloat(lp.longitude);
                    if (isNaN(lat) || isNaN(lng)) return;
                    bounds.push([lat, lng]);
                    var batt = lp.battery_level ? lp.battery_level + "%" : "?";
                    var popup = "<b>" + emp.employee_name + "</b><br>Battery: " + batt +
                        "<br>GPS: " + (lp.gps_enabled ? "On" : "Off") +
                        "<br>" + (lp.recorded_at || "");
                    if (markers[emp.name]) {
                        markers[emp.name].setLatLng([lat, lng]).setPopupContent(popup);
                    } else {
                        markers[emp.name] = L.marker([lat, lng]).addTo(map).bindPopup(popup);
                    }
                });
                if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
            }
        });
    }

    // Load Leaflet CSS/JS
    if (!window.L) {
        $('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">').appendTo("head");
        $.getScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", function () {
            load_employees();
        });
    } else {
        load_employees();
    }

    $refresh.click(load_employees);

    // Realtime updates
    frappe.realtime.on("live_position", function (data) {
        if (!map) return;
        var lat = parseFloat(data.latitude), lng = parseFloat(data.longitude);
        if (isNaN(lat) || isNaN(lng)) return;
        var popup = "<b>" + (data.employee_name || data.employee) + "</b><br>Battery: " +
            (data.battery_level || "?") + "%<br>GPS: " + (data.gps_enabled ? "On" : "Off");
        if (markers[data.employee]) {
            markers[data.employee].setLatLng([lat, lng]).setPopupContent(popup);
        } else {
            markers[data.employee] = L.marker([lat, lng]).addTo(map).bindPopup(popup);
        }
    });

    NT.copyright_footer(page.main);
};
