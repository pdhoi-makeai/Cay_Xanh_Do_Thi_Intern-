import frappe
def run():
    trees = frappe.get_all('Loai Cay', fields=['name', 'ten_loai_cay', 'model_3d'])
    print("TREES_START")
    for t in trees:
        print(f"{t.name} - {t.ten_loai_cay} - {t.model_3d}")
    print("TREES_END")
