import frappe

frappe.init(site="greencity.localhost", sites_path="sites")
frappe.connect()

print("Work Order Meta Fields:")
try:
    meta = frappe.get_meta("Work Order")
    for f in meta.fields:
        print(f"- {f.fieldname}: {f.fieldtype} (label: {f.label}, options: {f.options})")
except Exception as e:
    print("Error getting Work Order meta:", e)
