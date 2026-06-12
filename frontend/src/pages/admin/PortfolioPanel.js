import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const PortfolioPanel = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('inbox');
  const [loading, setLoading] = useState(true);

  // Data states
  const [messages, setMessages] = useState([]);
  const [services, setServices] = useState([]);
  const [team, setTeam] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [cmsContent, setCmsContent] = useState([]);

  // Form toggles & states
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form field states
  const [serviceForm, setServiceForm] = useState({ title: '', subtitle: '', description: '', icon_class: 'fa-microchip', features: '', link_url: '#', display_order: 0, is_active: 1 });
  const [teamForm, setTeamForm] = useState({ name: '', role: '', bio: '', image_url: '', social_links: '{"linkedin":"","github":""}', display_order: 0, is_active: 1 });
  const [testimonialForm, setTestimonialForm] = useState({ client_name: '', client_title: '', company: '', content: '', rating: 5, display_order: 0, is_active: 1 });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const fetchInbox = async () => {
    try {
      const res = await fetch('/api/admin/messages', { headers });
      if (res.ok) setMessages(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchCMSData = async () => {
    setLoading(true);
    try {
      // Pull CMS options
      const resCms = await fetch('/api/admin/content', { headers });
      if (resCms.ok) setCmsContent(await resCms.json());

      // Fetch public collections to manage
      const publicRes = await fetch('/api/content');
      if (publicRes.ok) {
        const publicData = await publicRes.json();
        setServices(publicData.services || []);
        setTeam(publicData.team || []);
        setTestimonials(publicData.testimonials || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inbox') fetchInbox();
    else fetchCMSData();
  }, [activeTab]);

  // Message Actions
  const handleMarkRead = async (id) => {
    try {
      const res = await fetch(`/api/admin/messages/${id}/read`, { method: 'PUT', headers });
      if (res.ok) {
        setSuccess('Message marked as read.');
        fetchInbox();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Delete message thread?')) return;
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setSuccess('Message thread removed.');
        fetchInbox();
      }
    } catch (err) { console.error(err); }
  };

  // CMS Content Update
  const handleUpdateCMSKey = async (id, value) => {
    try {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ content_value: value })
      });
      if (res.ok) {
        setSuccess('Section text updated.');
        fetchCMSData();
      }
    } catch (err) { console.error(err); }
  };

  // Services CRUD operations
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const url = editingItem ? `/api/admin/services/${editingItem.id}` : '/api/admin/services';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      let parsedFeatures = [];
      if (serviceForm.features) {
        parsedFeatures = typeof serviceForm.features === 'string' 
          ? serviceForm.features.split(',').map(f => f.trim()) 
          : serviceForm.features;
      }

      const payload = { ...serviceForm, features: parsedFeatures };
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (res.ok) {
        setSuccess(editingItem ? 'Service updated successfully.' : 'Service added successfully.');
        setShowForm(false);
        setEditingItem(null);
        setServiceForm({ title: '', subtitle: '', description: '', icon_class: 'fa-microchip', features: '', link_url: '#', display_order: 0, is_active: 1 });
        fetchCMSData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit service.');
      }
    } catch (err) {
      setError('API connection exception.');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete service item?')) return;
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setSuccess('Service item deleted.');
        fetchCMSData();
      }
    } catch (err) { console.error(err); }
  };

  // Team CRUD Operations
  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const url = editingItem ? `/api/admin/team/${editingItem.id}` : '/api/admin/team';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const parsedSocial = typeof teamForm.social_links === 'string' 
        ? JSON.parse(teamForm.social_links) 
        : teamForm.social_links;

      const payload = { ...teamForm, social_links: parsedSocial };
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (res.ok) {
        setSuccess(editingItem ? 'Team details updated.' : 'Team member registered.');
        setShowForm(false);
        setEditingItem(null);
        setTeamForm({ name: '', role: '', bio: '', image_url: '', social_links: '{"linkedin":"","github":""}', display_order: 0, is_active: 1 });
        fetchCMSData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit team member.');
      }
    } catch (err) {
      setError('Binds API failure.');
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Remove team member?')) return;
    try {
      const res = await fetch(`/api/admin/team/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setSuccess('Team member removed.');
        fetchCMSData();
      }
    } catch (err) { console.error(err); }
  };

  // Testimonials CRUD
  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const url = editingItem ? `/api/admin/testimonials/${editingItem.id}` : '/api/admin/testimonials';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(testimonialForm) });
      if (res.ok) {
        setSuccess(editingItem ? 'Testimonial modified.' : 'Testimonial created.');
        setShowForm(false);
        setEditingItem(null);
        setTestimonialForm({ client_name: '', client_title: '', company: '', content: '', rating: 5, display_order: 0, is_active: 1 });
        fetchCMSData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit recommendation.');
      }
    } catch (err) {
      setError('API pipeline error.');
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Remove testimonial recommendation?')) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setSuccess('Testimonial removed.');
        fetchCMSData();
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      {/* Alert Banner updates */}
      {success && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', fontSize: '13px', marginBottom: '20px' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', fontSize: '13px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Tabs Menu Selection */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '30px', gap: '8px' }}>
        <button className={`btn-secondary ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => setActiveTab('inbox')} style={{ borderBottom: activeTab === 'inbox' ? '2px solid var(--accent-gold)' : 'none' }}>
          Inbox Messages ({messages.length})
        </button>
        <button className={`btn-secondary ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')} style={{ borderBottom: activeTab === 'services' ? '2px solid var(--accent-gold)' : 'none' }}>
          CMS Services
        </button>
        <button className={`btn-secondary ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')} style={{ borderBottom: activeTab === 'team' ? '2px solid var(--accent-gold)' : 'none' }}>
          CMS Team
        </button>
        <button className={`btn-secondary ${activeTab === 'testimonials' ? 'active' : ''}`} onClick={() => setActiveTab('testimonials')} style={{ borderBottom: activeTab === 'testimonials' ? '2px solid var(--accent-gold)' : 'none' }}>
          Testimonials
        </button>
        <button className={`btn-secondary ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')} style={{ borderBottom: activeTab === 'general' ? '2px solid var(--accent-gold)' : 'none' }}>
          Landing Text Contents
        </button>
      </div>

      {loading && activeTab !== 'inbox' ? (
        <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>Loading resources...</div>
      ) : (
        <>
          {/* 1. CONTACT INBOX TAB OUTLET */}
          {activeTab === 'inbox' && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>Contact Lead Submissions</h3>
              </div>
              {messages.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No support threads currently in inbox.</p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Sender Details</th>
                        <th>Subject</th>
                        <th>Message Thread</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map(msg => (
                        <tr key={msg.id} style={{ opacity: msg.is_read ? 0.6 : 1 }}>
                          <td style={{ fontSize: '12px' }}>{new Date(msg.created_at).toLocaleString()}</td>
                          <td>
                            <div><b>{msg.name}</b></div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{msg.email}</div>
                          </td>
                          <td>{msg.subject || '(No Subject)'}</td>
                          <td style={{ maxWidth: '300px', fontSize: '13px' }}>{msg.message}</td>
                          <td>
                            <div className="admin-actions">
                              {!msg.is_read && (
                                <button onClick={() => handleMarkRead(msg.id)}>Read</button>
                              )}
                              <button onClick={() => handleDeleteMessage(msg.id)} style={{ backgroundColor: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2. SERVICES CRUD TAB OUTLET */}
          {activeTab === 'services' && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>Services Configurations</h3>
                <button onClick={() => { setShowForm(!showForm); setEditingItem(null); }}>
                  {showForm ? 'Cancel' : 'Add Service'}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleServiceSubmit} className="admin-form-grid" style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '30px' }}>
                  <div className="admin-form-group">
                    <label>Title</label>
                    <input type="text" value={serviceForm.title} onChange={e => setServiceForm({ ...serviceForm, title: e.target.value })} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Subtitle</label>
                    <input type="text" value={serviceForm.subtitle} onChange={e => setServiceForm({ ...serviceForm, subtitle: e.target.value })} />
                  </div>
                  <div className="admin-form-group full-width">
                    <label>Description</label>
                    <textarea value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Icon class (Light Sharp e.g. fa-microchip)</label>
                    <input type="text" value={serviceForm.icon_class} onChange={e => setServiceForm({ ...serviceForm, icon_class: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label>Features (comma separated)</label>
                    <input type="text" value={serviceForm.features} onChange={e => setServiceForm({ ...serviceForm, features: e.target.value })} placeholder="BOM sourcing, free tests" />
                  </div>
                  <div className="admin-form-group">
                    <label>Display Order</label>
                    <input type="number" value={serviceForm.display_order} onChange={e => setServiceForm({ ...serviceForm, display_order: parseInt(e.target.value) })} />
                  </div>
                  <div className="admin-form-group">
                    <label>Status</label>
                    <select value={serviceForm.is_active} onChange={e => setServiceForm({ ...serviceForm, is_active: parseInt(e.target.value) })}>
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                  <div className="admin-form-group full-width">
                    <button type="submit">Save Service</button>
                  </div>
                </form>
              )}

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Icon</th>
                      <th>Features</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(s => (
                      <tr key={s.id}>
                        <td><b>{s.title}</b></td>
                        <td><i className={`fa-light fa-sharp ${s.icon_class}`}></i></td>
                        <td>{Array.isArray(s.features) ? s.features.join(', ') : s.features}</td>
                        <td>{s.display_order}</td>
                        <td>
                          <span className={`badge ${s.is_active ? 'success' : ''}`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button onClick={() => {
                              setEditingItem(s);
                              setServiceForm({ ...s, features: Array.isArray(s.features) ? s.features.join(', ') : s.features });
                              setShowForm(true);
                            }}>Edit</button>
                            <button onClick={() => handleDeleteService(s.id)} style={{ backgroundColor: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. FOUNDERS TEAM TAB OUTLET */}
          {activeTab === 'team' && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>Founders & Board Members</h3>
                <button onClick={() => { setShowForm(!showForm); setEditingItem(null); }}>
                  {showForm ? 'Cancel' : 'Add Founder'}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleTeamSubmit} className="admin-form-grid" style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '30px' }}>
                  <div className="admin-form-group">
                    <label>Name</label>
                    <input type="text" value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Role</label>
                    <input type="text" value={teamForm.role} onChange={e => setTeamForm({ ...teamForm, role: e.target.value })} required />
                  </div>
                  <div className="admin-form-group full-width">
                    <label>Bio Profile</label>
                    <textarea value={teamForm.bio} onChange={e => setTeamForm({ ...teamForm, bio: e.target.value })} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Image URL</label>
                    <input type="text" value={teamForm.image_url} onChange={e => setTeamForm({ ...teamForm, image_url: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label>Social Links JSON</label>
                    <input type="text" value={teamForm.social_links} onChange={e => setTeamForm({ ...teamForm, social_links: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label>Display Order</label>
                    <input type="number" value={teamForm.display_order} onChange={e => setTeamForm({ ...teamForm, display_order: parseInt(e.target.value) })} />
                  </div>
                  <div className="admin-form-group">
                    <label>Status</label>
                    <select value={teamForm.is_active} onChange={e => setTeamForm({ ...teamForm, is_active: parseInt(e.target.value) })}>
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                  <div className="admin-form-group full-width">
                    <button type="submit">Save Details</button>
                  </div>
                </form>
              )}

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Bio</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map(t => (
                      <tr key={t.id}>
                        <td><b>{t.name}</b></td>
                        <td>{t.role}</td>
                        <td style={{ fontSize: '13px' }}>{t.bio}</td>
                        <td>
                          <span className={`badge ${t.is_active ? 'success' : ''}`}>{t.is_active ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button onClick={() => {
                              setEditingItem(t);
                              setTeamForm({ ...t, social_links: typeof t.social_links === 'string' ? t.social_links : JSON.stringify(t.social_links) });
                              setShowForm(true);
                            }}>Edit</button>
                            <button onClick={() => handleDeleteTeam(t.id)} style={{ backgroundColor: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. TESTIMONIALS TAB OUTLET */}
          {activeTab === 'testimonials' && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>Customer Testimonials</h3>
                <button onClick={() => { setShowForm(!showForm); setEditingItem(null); }}>
                  {showForm ? 'Cancel' : 'Add Testimonial'}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleTestimonialSubmit} className="admin-form-grid" style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '30px' }}>
                  <div className="admin-form-group">
                    <label>Client Name</label>
                    <input type="text" value={testimonialForm.client_name} onChange={e => setTestimonialForm({ ...testimonialForm, client_name: e.target.value })} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Client Title / Designation</label>
                    <input type="text" value={testimonialForm.client_title} onChange={e => setTestimonialForm({ ...testimonialForm, client_title: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label>Company</label>
                    <input type="text" value={testimonialForm.company} onChange={e => setTestimonialForm({ ...testimonialForm, company: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label>Rating (1-5)</label>
                    <input type="number" min="1" max="5" value={testimonialForm.rating} onChange={e => setTestimonialForm({ ...testimonialForm, rating: parseInt(e.target.value) })} />
                  </div>
                  <div className="admin-form-group full-width">
                    <label>Recommendation Message</label>
                    <textarea value={testimonialForm.content} onChange={e => setTestimonialForm({ ...testimonialForm, content: e.target.value })} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Display Order</label>
                    <input type="number" value={testimonialForm.display_order} onChange={e => setTestimonialForm({ ...testimonialForm, display_order: parseInt(e.target.value) })} />
                  </div>
                  <div className="admin-form-group">
                    <label>Status</label>
                    <select value={testimonialForm.is_active} onChange={e => setTestimonialForm({ ...testimonialForm, is_active: parseInt(e.target.value) })}>
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                  <div className="admin-form-group full-width">
                    <button type="submit">Save Testimonial</button>
                  </div>
                </form>
              )}

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Designation</th>
                      <th>Rating</th>
                      <th>Message</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testimonials.map(t => (
                      <tr key={t.id}>
                        <td><b>{t.client_name}</b></td>
                        <td>{t.client_title} {t.company && `at ${t.company}`}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{t.rating} Stars</td>
                        <td style={{ fontSize: '13px', maxWidth: '300px' }}>{t.content}</td>
                        <td>
                          <span className={`badge ${t.is_active ? 'success' : ''}`}>{t.is_active ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button onClick={() => {
                              setEditingItem(t);
                              setTestimonialForm(t);
                              setShowForm(true);
                            }}>Edit</button>
                            <button onClick={() => handleDeleteTestimonial(t.id)} style={{ backgroundColor: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. GENERAL CMS VALUES OUTLET */}
          {activeTab === 'general' && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>Landing Page Section Texts</h3>
              </div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '150px' }}>Section</th>
                      <th style={{ width: '150px' }}>Key</th>
                      <th>Current Value</th>
                      <th>Action Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cmsContent.map(item => (
                      <tr key={item.id}>
                        <td style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600 }}>{item.section}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{item.content_key}</td>
                        <td>
                          <textarea
                            defaultValue={item.content_value}
                            onBlur={(e) => {
                              if (e.target.value !== item.content_value) {
                                handleUpdateCMSKey(item.id, e.target.value);
                              }
                            }}
                            rows="2"
                            style={{ resize: 'vertical' }}
                          />
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Auto-updates on blur
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PortfolioPanel;
