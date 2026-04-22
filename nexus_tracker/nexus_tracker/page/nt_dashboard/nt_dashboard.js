frappe.pages["nt-dashboard"].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({parent: wrapper, title: "Nexus Tracker Dashboard", single_column: true});

    var $body = $(wrapper).find(".page-content");
    $body.css({padding: "16px"});

    function make_card(label, value, color, icon) {
        return $('<div class="nt-stat-card" style="display:inline-block;margin:8px;min-width:160px;border-left:4px solid '+color+';">' +
            '<div class="nt-stat-label">'+icon+' '+label+'</div>' +
            '<div class="nt-stat-value" style="color:'+color+'">'+value+'</div></div>');
    }

    var $cards = $('<div style="margin-bottom:16px"></div>').appendTo(page.main);
    var $table_area = $('<div></div>').appendTo(page.main);

    function load_dashboard() {
        $cards.html('<p style="color:var(--text-muted);padding:8px">Loading...</p>');

        // Load stats in parallel
        frappe.call({method: "frappe.client.get_count", args: {doctype: "FT Employee", filters: {is_active: 1}}, callback: function(r) {
            var emp_count = r.message || 0;
            frappe.call({method: "frappe.client.get_count", args: {doctype: "FT Shift", filters: {is_active: 1}}, callback: function(r2) {
                var shift_count = r2.message || 0;
                frappe.call({method: "frappe.client.get_count", args: {doctype: "FT Alert", filters: {is_read: 0}}, callback: function(r3) {
                    var alert_count = r3.message || 0;
                    frappe.call({method: "frappe.client.get_count", args: {doctype: "FT Client Visit", filters: {checked_in_at: [">=", frappe.datetime.get_today()]}}, callback: function(r4) {
                        var visit_count = r4.message || 0;
                        frappe.call({method: "frappe.client.get_count", args: {doctype: "FT Client"}, callback: function(r5) {
                            var client_count = r5.message || 0;
                            $cards.empty();
                            make_card("Active Employees", emp_count, "#2490EF", "👤").appendTo($cards);
                            make_card("Active Shifts", shift_count, "#28a745", "⏱").appendTo($cards);
                            make_card("Unread Alerts", alert_count, "#dc3545", "🔔").appendTo($cards);
                            make_card("Visits Today", visit_count, "#fd7e14", "🏢").appendTo($cards);
                            make_card("Total Clients", client_count, "#6f42c1", "🗂").appendTo($cards);
                        }});
                    }});
                }});
            }});
        }});

        // Recent alerts table
        frappe.call({
            method: "nexus_tracker.nexus_tracker.api.alerts.get_alerts",
            args: {unread_only: 1, limit: 10},
            callback: function(r) {
                $table_area.empty();
                if (!r.message || !r.message.length) {
                    $table_area.html('<div style="padding:16px;color:var(--text-muted)">✅ No unread alerts</div>');
                    return;
                }
                var html = '<h6 style="margin:16px 0 8px 0">🔔 Unread Alerts</h6><table class="table table-bordered table-sm"><thead><tr><th>Employee</th><th>Type</th><th>Message</th><th>Time</th><th>Action</th></tr></thead><tbody>';
                r.message.forEach(function(a) {
                    html += '<tr><td>'+a.employee+'</td><td><span class="badge" style="background:#dc3545">'+a.alert_type+'</span></td><td>'+(a.message||"")+'</td><td>'+frappe.datetime.prettyDate(a.created_at)+'</td><td><button class="btn btn-xs btn-default mark-read" data-name="'+a.name+'">✓ Read</button></td></tr>';
                });
                html += '</tbody></table>';
                $table_area.html(html);
                $table_area.find(".mark-read").click(function() {
                    var name = $(this).data("name");
                    frappe.call({method: "nexus_tracker.nexus_tracker.api.alerts.mark_alert_read", args: {alert_name: name}, callback: function() {
                        load_dashboard();
                    }});
                });
            }
        });
    }

    load_dashboard();

    // Refresh button
    page.add_inner_button("🔄 Refresh", load_dashboard);

    // Auto refresh every 60 seconds
    setInterval(load_dashboard, 60000);

    NT.copyright_footer(page.main);
};