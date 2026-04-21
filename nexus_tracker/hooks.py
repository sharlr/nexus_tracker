app_name = "nexus_tracker"
app_title = "NEXUS RAJAN - TRACKER PRO"
app_publisher = "NEXUS RAJAN"
app_description = "Field Employee Tracking, GPS Management & Client Visit Platform"
app_email = "admin@nexusrajan.com"
app_license = "MIT"
app_version = "2.0.0"
app_icon = "octicon octicon-location"
app_color = "#2490EF"

after_install = "nexus_tracker.install.after_install"
after_uninstall = "nexus_tracker.install.after_uninstall"

fixtures = [
    {"dt": "Role", "filters": [["name", "in", ["Field Employee", "Field Manager", "Field Supervisor"]]]},
]

scheduler_events = {
    "cron": {
        "*/15 * * * *": [
            "nexus_tracker.nexus_tracker.api.alerts.check_inactive_employees",
            "nexus_tracker.nexus_tracker.api.alerts.check_low_battery",
        ],
        "0 0 * * *": [
            "nexus_tracker.nexus_tracker.api.shifts.close_open_shifts",
        ],
        "0 6 * * *": [
            "nexus_tracker.nexus_tracker.api.tasks.create_recurring_tasks",
        ],
    }
}

app_include_js = ["/assets/nexus_tracker/js/nexus_tracker.min.js"]
app_include_css = ["/assets/nexus_tracker/css/nexus_tracker.min.css"]

website_route_rules = [
    {"from_route": "/tracker-portal/<path:name>", "to_route": "tracker_portal"},
]
