import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { getAllAssets, createAsset, updateAsset, logMaintenance, deleteAsset } from '../../services/apiService';

const BLANK_ASSET = { name: '', type: 'Furniture', location: { hostel: '', block: '', room: '' }, condition: 'Good', acquisitionDate: '' };
const BLANK_MAINT = { description: '', performedBy: '', cost: '', newCondition: '' };

const CONDITION_STYLE = {
  'Good':         'bg-emerald-50 text-emerald-600',
  'Fair':         'bg-blue-50 text-blue-600',
  'Damaged':      'bg-amber-50 text-amber-600',
  'Under Repair': 'bg-rose-50 text-rose-600',
  'Disposed':     'bg-gray-100 text-gray-500',
};

export default function AssetManagement() {
  const [assets, setAssets] = useState([]);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetForm, setAssetForm] = useState(BLANK_ASSET);
  const [maintenanceForm, setMaintenanceForm] = useState(BLANK_MAINT);

  useEffect(() => { fetchAssets(); }, []);

  const fetchAssets = () => getAllAssets().then(r => setAssets(r.data)).catch(() => {});

  const setLoc = (field, value) =>
    setAssetForm(f => ({ ...f, location: { ...f.location, [field]: value } }));

  const handleAssetSubmit = async () => {
    if (!assetForm.name || !assetForm.location.hostel) return alert('Name and hostel are required');
    try {
      if (selectedAsset) {
        await updateAsset(selectedAsset._id, assetForm);
      } else {
        await createAsset(assetForm);
      }
      fetchAssets();
      setIsAssetModalOpen(false);
    } catch {
      alert('Failed to save asset');
    }
  };

  const handleMaintenanceSubmit = async () => {
    if (!maintenanceForm.description) return alert('Description is required');
    try {
      const payload = {
        description: maintenanceForm.description,
        performedBy: maintenanceForm.performedBy,
        cost: maintenanceForm.cost ? Number(maintenanceForm.cost) : undefined,
        newCondition: maintenanceForm.newCondition || undefined,
      };
      await logMaintenance(selectedAsset._id, payload);
      fetchAssets();
      setIsMaintenanceModalOpen(false);
    } catch {
      alert('Failed to log maintenance');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this asset?')) return;
    try { await deleteAsset(id); fetchAssets(); }
    catch { alert('Failed to delete asset'); }
  };

  const openNewAsset = () => {
    setSelectedAsset(null);
    setAssetForm(BLANK_ASSET);
    setIsAssetModalOpen(true);
  };

  const openEditAsset = (asset) => {
    setSelectedAsset(asset);
    setAssetForm({
      name: asset.name,
      type: asset.type,
      location: { hostel: asset.location?.hostel || '', block: asset.location?.block || '', room: asset.location?.room || '' },
      condition: asset.condition,
      acquisitionDate: asset.acquisitionDate?.slice(0, 10) || '',
    });
    setIsAssetModalOpen(true);
  };

  const openMaintenance = (asset) => {
    setSelectedAsset(asset);
    setMaintenanceForm(BLANK_MAINT);
    setIsMaintenanceModalOpen(true);
  };

  const formatLocation = (loc) => {
    if (!loc) return '—';
    return [loc.hostel, loc.block, loc.room].filter(Boolean).join(' / ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">Asset Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track hostel inventory, conditions, and maintenance logs</p>
        </div>
        <Button onClick={openNewAsset}>+ Add Asset</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table
          headers={['Asset', 'Location', 'Condition', 'Last Maintenance', 'Actions']}
          data={assets}
          renderRow={(asset) => (
            <>
              <td className="px-6 py-4">
                <p className="font-bold text-gray-900">{asset.name}</p>
                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{asset.type}</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">{formatLocation(asset.location)}</td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${CONDITION_STYLE[asset.condition] || 'bg-gray-100 text-gray-500'}`}>
                  {asset.condition}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString() : 'Never'}
                {asset.maintenanceLog?.length > 0 && (
                  <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded">({asset.maintenanceLog.length} logs)</span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-3">
                  <button onClick={() => openMaintenance(asset)} className="text-amber-600 hover:text-amber-800 text-xs font-bold">+ Maint.</button>
                  <button onClick={() => openEditAsset(asset)} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold">Edit</button>
                  <button onClick={() => handleDelete(asset._id)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Remove</button>
                </div>
              </td>
            </>
          )}
        />
      </Card>

      {/* Add / Edit Asset Modal */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedAsset ? 'Edit Asset' : 'Add New Asset'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Asset Name *</label>
                <input value={assetForm.name} onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Water Cooler" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
                  <select value={assetForm.type} onChange={e => setAssetForm({ ...assetForm, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500">
                    <option>Furniture</option><option>Appliance</option><option>Infrastructure</option><option>Electronics</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Condition</label>
                  <select value={assetForm.condition} onChange={e => setAssetForm({ ...assetForm, condition: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500">
                    <option>Good</option><option>Fair</option><option>Damaged</option><option>Under Repair</option><option>Disposed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Hostel *</label>
                <input value={assetForm.location.hostel} onChange={e => setLoc('hostel', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Brahmaputra Hostel" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Block</label>
                  <input value={assetForm.location.block} onChange={e => setLoc('block', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Room</label>
                  <input value={assetForm.location.room} onChange={e => setLoc('room', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. 104" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Acquisition Date</label>
                <input type="date" value={assetForm.acquisitionDate} onChange={e => setAssetForm({ ...assetForm, acquisitionDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setIsAssetModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAssetSubmit}>Save Asset</Button>
            </div>
          </div>
        </div>
      )}

      {/* Log Maintenance Modal */}
      {isMaintenanceModalOpen && selectedAsset && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Log Maintenance</h2>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-bold text-gray-800">{selectedAsset.name}</span>
              <span className="ml-2 text-gray-400">· {formatLocation(selectedAsset.location)}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description *</label>
                <textarea value={maintenanceForm.description} onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500 h-20 resize-none"
                  placeholder="What was done..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Performed By</label>
                  <input value={maintenanceForm.performedBy} onChange={e => setMaintenanceForm({ ...maintenanceForm, performedBy: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Electrician Team" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Cost (₹)</label>
                  <input type="number" min="0" value={maintenanceForm.cost} onChange={e => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                    placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Update Condition (optional)</label>
                <select value={maintenanceForm.newCondition} onChange={e => setMaintenanceForm({ ...maintenanceForm, newCondition: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-indigo-500">
                  <option value="">— Keep current ({selectedAsset.condition}) —</option>
                  <option>Good</option><option>Fair</option><option>Damaged</option><option>Under Repair</option><option>Disposed</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setIsMaintenanceModalOpen(false)}>Cancel</Button>
              <Button onClick={handleMaintenanceSubmit}>Log Maintenance</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
