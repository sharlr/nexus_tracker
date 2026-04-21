import frappe

def after_install():
    """Create default roles and workspace after app install."""
    for role in ["Field Employee", "Field Manager", "Field Supervisor"]:
        if not frappe.db.exists("Role", role):
            frappe.get_doc({"doctype": "Role", "role_name": role}).insert(ignore_permissions=True)
    frappe.db.commit()
    print("NEXUS RAJAN - TRACKER PRO installed successfully!")

def after_uninstall():
    print("NEXUS RAJAN - TRACKER PRO uninstalled.")
