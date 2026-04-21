frappe.pages["route-replay"].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __("Route Replay"),
        single_column: true,
    });

    var $bar = $('<div class="nt-filter-bar"></div>').appendTo(page.main);
    var $emp = $('<input class="form-control input-xs" placeholder="Employee ID" style="max-width:180px">').appendTo($bar);
    var $date = $('<input type="date" class="form-control input-xs" style="max-width:140px">').appendTo($bar);
    var $load = $('<button class="btn btn-xs btn-primary" style="margin-left:8px">Load Route</button>').appendTo($bar);

    var $info = $('<div style="padding:8px 16px;font-size:12px;color:var(--text-muted)"></div>').appendTo(page.main);
    var $map_div = $('<div id="nt-replay-map" style="height:calc(100vh - 200px);width:100%;"></div>').appendTo(page.main);

    var map, polyline, marker, pings = [], timer, idx = 0;

    $date.val(frappe.datetime.get_today());

    function init_map() {
        if (map) return;
        map = L.map("nt-replay-map").setView([0, 0], 4);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors"
        }).addTo(map);
    }

    $load.click(function () {
        var emp = $emp.val(), date = $date.val();
        if (!emp || !date) { frappe.msgprint("Please enter employee and date."); return; }
        frappe.call({
            method: "nexus_tracker.nexus_tracker.api.shifts.get_employee_route",
            args: { employee: emp, date: date },
            callback: function (r) {
                if (!r.message) return;
                pings = r.message.pings || [];
                var shift = r.message.shift;
                if (!pings.length) { frappe.msgprint("No GPS pings found."); return; }
                if (!window.L) {
                    $('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">').appendTo("head");
                    $.getScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", function () { draw_route(shift); });
                } else { draw_route(shift); }
            }
        });
    });

    function draw_route(shift) {
        init_map();
        if (polyline) map.removeLayer(polyline);
        if (marker) map.removeLayer(marker);
        var latlngs = pings.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);
        polyline = L.polyline(latlngs, { color: "#2490EF", weight: 3 }).addTo(map);
        map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
        marker = L.marker(latlngs[0]).addTo(map);
        idx = 0;
        if (shift) {
            $info.html("Start: " + (shift.started_at || "-") + " | End: " + (shift.ended_at || "-") +
                " | Distance: " + (shift.total_km || 0).toFixed(2) + " km");
        }
        clearInterval(timer);
        timer = setInterval(function () {
            if (idx >= latlngs.length) { clearInterval(timer); return; }
            marker.setLatLng(latlngs[idx]);
            idx++;
        }, 300);
    }

    NT.copyright_footer(page.main);
};
