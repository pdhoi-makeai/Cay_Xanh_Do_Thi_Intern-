import frappe

frappe.init(site="greencity.localhost", sites_path="sites")
frappe.connect()

doctypes = [d.name for d in frappe.db.get_all("DocType", filters={"custom": 1})]
print("=== Custom DocTypes ===")
for dt in doctypes:
    print(dt)
