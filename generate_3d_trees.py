import json
import struct
import math
import os

def generate_tileset(trees, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Convert trees (lat, lon) to ECEF (X, Y, Z) and collect batch data
    # WGS84 ellipsoid constants
    a = 6378137.0
    e2 = 0.00669437999014
    
    positions = []
    ids = []
    statuses = []
    
    for t in trees:
        lat_deg = t.get('latitude', 0)
        lon_deg = t.get('longitude', 0)
        lat = math.radians(lat_deg)
        lon = math.radians(lon_deg)
        h = 0.0 # elevation
        
        N = a / math.sqrt(1 - e2 * math.sin(lat)**2)
        X = (N + h) * math.cos(lat) * math.cos(lon)
        Y = (N + h) * math.cos(lat) * math.sin(lon)
        Z = (N * (1 - e2) + h) * math.sin(lat)
        
        # We need relative positions to the center of the tileset to avoid precision loss
        positions.append((X, Y, Z))
        ids.append(t.get('ma_tai_san', ''))
        statuses.append(t.get('trang_thai', ''))

    if not positions:
        return

    # Center of the tileset
    cX = sum(p[0] for p in positions) / len(positions)
    cY = sum(p[1] for p in positions) / len(positions)
    cZ = sum(p[2] for p in positions) / len(positions)
    
    # RTC (Relative to Center) positions
    rtc_positions = []
    for p in positions:
        rtc_positions.append((p[0]-cX, p[1]-cY, p[2]-cZ))
        
    num_instances = len(trees)
    
    # 2. Build Feature Table
    # Feature table needs POSITION (float32 x 3 x N) and RTC_CENTER (float32 x 3)
    feature_table_json = {
        "INSTANCES_LENGTH": num_instances,
        "RTC_CENTER": [cX, cY, cZ],
        "POSITION": {
            "byteOffset": 0
        }
    }
    
    # Pad JSON to 8-byte boundary
    ft_json_str = json.dumps(feature_table_json, separators=(',', ':'))
    while len(ft_json_str) % 8 != 0:
        ft_json_str += ' '
        
    # Feature Table Binary (positions)
    ft_bin = bytearray()
    for p in rtc_positions:
        ft_bin += struct.pack('<3f', p[0], p[1], p[2])
    
    # Pad binary to 8-byte boundary
    while len(ft_bin) % 8 != 0:
        ft_bin += b'\x00'

    # 3. Build Batch Table
    batch_table_json = {
        "id": ids,
        "status": statuses
    }
    bt_json_str = json.dumps(batch_table_json, separators=(',', ':'))
    while len(bt_json_str) % 8 != 0:
        bt_json_str += ' '
        
    bt_bin = bytearray() # Empty for now

    # 4. GLB URL (we use URL mode, gltfFormat=0)
    # The URI to the tree.glb file
    glb_uri = b"../../tree.glb"
    while len(glb_uri) % 8 != 0:
        glb_uri += b' '

    # 5. Build i3dm Header
    # 32 bytes
    magic = b'i3dm'
    version = 1
    ft_json_len = len(ft_json_str)
    ft_bin_len = len(ft_bin)
    bt_json_len = len(bt_json_str)
    bt_bin_len = len(bt_bin)
    gltf_format = 0 # 0 for URL
    
    byte_length = 32 + ft_json_len + ft_bin_len + bt_json_len + bt_bin_len + len(glb_uri)
    
    header = struct.pack('<4sIIIIIII', 
        magic, 
        version, 
        byte_length,
        ft_json_len,
        ft_bin_len,
        bt_json_len,
        bt_bin_len,
        gltf_format
    )
    
    # 6. Write i3dm file
    with open(os.path.join(output_dir, 'trees.i3dm'), 'wb') as f:
        f.write(header)
        f.write(ft_json_str.encode('utf-8'))
        f.write(ft_bin)
        f.write(bt_json_str.encode('utf-8'))
        f.write(bt_bin)
        f.write(glb_uri)
        
    # 7. Write tileset.json
    tileset_json = {
        "asset": {
            "version": "1.0",
            "tilesetVersion": "1.0.0"
        },
        "geometricError": 10000,
        "root": {
            "boundingVolume": {
                "sphere": [cX, cY, cZ, 5000] # roughly
            },
            "geometricError": 0,
            "refine": "REPLACE",
            "content": {
                "uri": "trees.i3dm"
            }
        }
    }
    
    with open(os.path.join(output_dir, 'tileset.json'), 'w') as f:
        json.dump(tileset_json, f, indent=2)

if __name__ == '__main__':
    # Test data
    test_trees = [
        {"ma_tai_san": "T1", "latitude": 16.0748, "longitude": 108.1512, "trang_thai": "Tốt"},
        {"ma_tai_san": "T2", "latitude": 16.0750, "longitude": 108.1514, "trang_thai": "Sâu bệnh"},
    ]
    generate_tileset(test_trees, 'public/3dtiles/trees')
    print("Tileset generated!")
