frappe.ui.form.on("FT Client", {
    refresh: function(frm) {
        frm.add_custom_button(__("📍 Pick Location on Map"), function() {
            show_map_picker(frm);
        });
        if (frm.doc.latitude && frm.doc.longitude) {
            show_current_location(frm);
        }
    }
});

function show_map_picker(frm) {
    let lat = frm.doc.latitude || 11.5886;
    let lng = frm.doc.longitude || 43.1451;
    let d = new frappe.ui.Dialog({
        title: __("Pick Client Location on Map"),
        size: "extra-large",
        fields: [{
            fieldtype: "HTML",
            fieldname: "map_html",
            options: '<div style="padding:8px 0 4px 0;color:var(--text-muted);font-size:12px;">🖱️ Click anywhere on the map to set location. Drag marker to adjust.</div><div id="ft-client-map-picker" style="height:500px;width:100%;border-radius:8px;border:1px solid var(--border-color);"></div><div style="margin-top:8px;padding:8px;background:var(--control-bg);border-radius:4px;font-size:12px;font-family:monospace;">📍 Lat: <b id="ft-lat-val">' + lat + '</b> &nbsp;|&nbsp; Lng: <b id="ft-lng-val">' + lng + '</b></div>'
        }],
        primary_action_label: __("✅ Set This Location"),
        primary_action: function() {
            frm.set_value("latitude", parseFloat($("#ft-lat-val").text()));
            frm.set_value("longitude", parseFloat($("#ft-lng-val").text()));
            frm.dirty();
            d.hide();
            frappe.show_alert({message: __("Location updated! Click Save."), indicator: "green"});
        }
    });
    d.show();
    function init_picker_map() {
        let map = L.map("ft-client-map-picker").setView([lat, lng], 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {attribution: "© OpenStreetMap contributors"}).addTo(map);
        let marker = L.marker([lat, lng], {draggable: true}).addTo(map);
        marker.bindPopup(__("Drag me to set location")).openPopup();
        function update_coords(latlng) {
            $("#ft-lat-val").text(latlng.lat.toFixed(6));
            $("#ft-lng-val").text(latlng.lng.toFixed(6));
        }
        marker.on("dragend", function(e) { update_coords(e.target.getLatLng()); });
        map.on("click", function(e) { marker.setLatLng(e.latlng); update_coords(e.latlng); });
        setTimeout(function() { map.invalidateSize(); }, 300);
    }
    setTimeout(function() {
        if (!window.L) {
            $('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">').appendTo("head");
            $.getScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", init_picker_map);
        } else { init_picker_map(); }
    }, 400);
}

function show_current_location(frm) {
    if ($("#ft-location-preview").length) return;
    let $preview = $('<div id="ft-location-preview" style="margin:16px 0;"><div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">📍 Current Location</div><div id="ft-preview-map" style="height:200px;border-radius:8px;border:1px solid var(--border-color);"></div></div>').appendTo(frm.fields_dict.address.wrapper);
    setTimeout(function() {
        function init_preview() {
            let map = L.map("ft-preview-map", {zoomControl:true}).setView([frm.doc.latitude, frm.doc.longitude], 15);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {attribution: "© OpenStreetMap"}).addTo(map);
            L.marker([frm.doc.latitude, frm.doc.longitude]).addTo(map).bindPopup(frm.doc.client_name || "Client Location").openPopup();
        }
        if (!window.L) {
            $('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">').appendTo("head");
            $.getScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", init_preview);
        } else { init_preview(); }
    }, 500);
}
