import React, { useState } from 'react';
import { 
  Dialog, 
  DialogSurface, 
  DialogBody, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Input,
  Select,
  Spinner,
  MessageBar,
  MessageBarBody,
  Label
} from '@fluentui/react-components';
import { osmService } from '../../services/osmService';

interface OsmImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (geojson: any, name: string, type: 'route' | 'park') => void;
}

export const OsmImportDialog: React.FC<OsmImportDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'route' | 'park'>('route');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleImport = async () => {
    if (!query) {
      setError('Vui lòng nhập tên tuyến đường hoặc công viên.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const geojson = await osmService.fetchGeometry(query, type);
      onSuccess(geojson, query, type);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu từ OSM');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Tải dữ liệu từ OpenStreetMap</DialogTitle>
          <DialogContent className="flex flex-col gap-4 py-4">
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            
            <div>
              <Label>Loại hình học</Label>
              <Select value={type} onChange={(_, data) => setType(data.value as any)} className="w-full mt-1">
                <option value="route">Tuyến đường (Polyline)</option>
                <option value="park">Công viên (Polygon)</option>
              </Select>
            </div>
            
            <div>
              <Label>Tên cần tìm kiếm (VD: Nguyễn Văn Linh)</Label>
              <Input 
                value={query} 
                onChange={(_, data) => setQuery(data.value)} 
                className="w-full mt-1" 
                placeholder="Nhập tên..."
              />
              <p className="text-xs text-slate-500 mt-1">
                Hệ thống sẽ tìm kiếm trong khu vực Đà Nẵng.
              </p>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button appearance="primary" onClick={handleImport} disabled={loading || !query}>
              {loading ? <Spinner size="tiny" /> : 'Tải dữ liệu'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
