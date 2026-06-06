import React, { useState } from 'react';

const CONNECTOR_TYPES = ['CCS2', 'CHAdeMO', 'Type 2'];
const STATUSES = ['AVAILABLE', 'IN_USE', 'OFFLINE', 'MAINTENANCE'];

export default function StationEditor({ station, onSave, onClose }) {
  const [form, setForm] = useState({
    name: station?.name || '',
    address: station?.address || '',
    area: station?.area || '',
    city: station?.city || 'Lagos',
    lat: station?.lat || '',
    lng: station?.lng || '',
    operatorName: station?.operatorName || '',
    connectors: station?.connectors || [{ id: 'c1', type: 'CCS2', power: 50, status: 'AVAILABLE' }],
  });

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addConnector = () => {
    const id = `c${form.connectors.length + 1}`;
    setForm(prev => ({
      ...prev,
      connectors: [...prev.connectors, { id, type: 'Type 2', power: 22, status: 'AVAILABLE' }],
    }));
  };

  const removeConnector = (idx) => {
    setForm(prev => ({
      ...prev,
      connectors: prev.connectors.filter((_, i) => i !== idx),
    }));
  };

  const updateConnector = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      connectors: prev.connectors.map((c, i) => i === idx ? { ...c, [field]: field === 'power' ? Number(value) : value } : c),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.lat || !form.lng) return;
    onSave({
      ...form,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      status: form.connectors.some(c => c.status === 'AVAILABLE') ? 'AVAILABLE' : 'IN_USE',
    });
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto' }}>
        <button className="auth-close" onClick={onClose}>✕</button>
        <h2 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>{station ? 'Edit Station' : '+ Add New Station'}</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input className="auth-input" placeholder="Station name *" value={form.name} onChange={e => updateField('name', e.target.value)} required />
          <input className="auth-input" placeholder="Address" value={form.address} onChange={e => updateField('address', e.target.value)} />
          <div style={{ display: 'flex', gap: '12px' }}>
            <input className="auth-input" placeholder="Area (e.g. Lekki)" value={form.area} onChange={e => updateField('area', e.target.value)} style={{ flex: 1 }} />
            <select className="auth-input" value={form.city} onChange={e => updateField('city', e.target.value)} style={{ flex: 1 }}>
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input className="auth-input" type="number" step="any" placeholder="Latitude *" value={form.lat} onChange={e => updateField('lat', e.target.value)} style={{ flex: 1 }} required />
            <input className="auth-input" type="number" step="any" placeholder="Longitude *" value={form.lng} onChange={e => updateField('lng', e.target.value)} style={{ flex: 1 }} required />
          </div>
          <input className="auth-input" placeholder="Operator name" value={form.operatorName} onChange={e => updateField('operatorName', e.target.value)} />

          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Connectors</div>
          {form.connectors.map((conn, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select className="auth-input" value={conn.type} onChange={e => updateConnector(idx, 'type', e.target.value)} style={{ flex: 1 }}>
                {CONNECTOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input className="auth-input" type="number" placeholder="kW" value={conn.power} onChange={e => updateConnector(idx, 'power', e.target.value)} style={{ width: '80px' }} />
              <select className="auth-input" value={conn.status} onChange={e => updateConnector(idx, 'status', e.target.value)} style={{ flex: 1 }}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {form.connectors.length > 1 && (
                <button type="button" onClick={() => removeConnector(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addConnector} style={{ background: 'transparent', border: '1px dashed var(--text-3)', color: 'var(--text-2)', padding: '8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem' }}>
            + Add Connector
          </button>

          <button className="auth-submit" type="submit" style={{ marginTop: '8px' }}>
            {station ? 'Save Changes' : 'Create Station'}
          </button>
        </form>
      </div>
    </div>
  );
}
