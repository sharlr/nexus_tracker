import frappe
from frappe.utils import today


@frappe.whitelist()
def close_open_shifts():
    from frappe.utils import add_days, now_datetime
    yesterday = add_days(today(), -1)
    for s in frappe.get_all("FT Shift", filters={"date": yesterday, "is_active": 1}, fields=["name"]):
        frappe.db.set_value("FT Shift", s.name, {"is_active": 0, "ended_at": now_datetime()})
    frappe.db.commit()


@frappe.whitelist()
def get_admin_employees(branch=None, department=None, territory=None, employee=None):
    f = {"is_active": 1}
    if branch: f["branch"] = branch
    if department: f["department"] = department
    if employee: f["name"] = employee
    emps = frappe.get_all("FT Employee", filters=f,
        fields=["name", "employee_name", "email", "department", "branch", "supervisor", "photo"])
    for emp in emps:
        lp = frappe.db.get_value("FT Location Ping", {"employee": emp.name},
            ["latitude", "longitude", "battery_level", "gps_enabled", "network_type", "phone_model", "recorded_at"],
            order_by="recorded_at desc", as_dict=True)
        emp["last_ping"] = lp
    return emps


@frappe.whitelist()
def get_employee_route(employee, date):
    pings = frappe.get_all("FT Location Ping",
        filters={"employee": employee, "recorded_at": [">=", date]},
        fields=["latitude", "longitude", "battery_level", "gps_enabled", "network_type", "recorded_at"],
        order_by="recorded_at asc", limit=1000)
    shift = frappe.db.get_value("FT Shift", {"employee": employee, "date": date},
        ["name", "started_at", "ended_at", "total_km", "total_minutes", "is_active"], as_dict=True)
    visits = frappe.get_all("FT Client Visit",
        filters={"employee": employee, "checked_in_at": [">=", date]},
        fields=["name", "client", "checked_in_at", "checked_out_at", "latitude", "longitude", "rating"])
    return {"pings": pings, "shift": shift, "visits": visits}


@frappe.whitelist()
def get_daily_report(date=None, branch=None, department=None, employee=None):
    d = date or today()
    f = {"is_active": 1}
    if branch: f["branch"] = branch
    if department: f["department"] = department
    if employee: f["name"] = employee
    emps = frappe.get_all("FT Employee", filters=f,
        fields=["name", "employee_name", "department", "branch"])
    report = []
    for emp in emps:
        shift = frappe.db.get_value("FT Shift", {"employee": emp.name, "date": d},
            ["name", "started_at", "ended_at", "total_km", "total_minutes"], as_dict=True)
        visits = frappe.get_all("FT Client Visit",
            filters={"employee": emp.name, "checked_in_at": [">=", d]},
            fields=["name", "client"]) if shift else []
        report.append({"employee": emp, "shift": shift, "visits": visits})
    return {"date": d, "report": report}
