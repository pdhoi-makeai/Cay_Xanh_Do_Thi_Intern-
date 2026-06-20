import frappe
def run():
    cols = frappe.db.get_table_columns("Loai Cay")
    print("COLUMNS_START")
    print(cols)
    print("COLUMNS_END")
