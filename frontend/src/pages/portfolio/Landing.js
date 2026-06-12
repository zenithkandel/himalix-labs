import React, { useState, useEffect, useRef } from 'react';

const Landing = () => {
  const [data, setData] = useState({
    sections: {},
    services: [],
    team: [],
    testimonials: [],
    settings: {}
  });
  const [loading, setLoading] = useState(true);

  // Contact form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');
  const [sending, setSending] = useState(false);

  const canvasRef = useRef(null);

  // Fetch unified CMS landing data
  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const res = await fetch('/api/content');
        if (res.ok) {
          const cmsData = await res.json();
          setData(cmsData);
        }
      } catch (err) {
        console.error('Failed to load portfolio CMS content:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  // Particle Canvas connection animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = 600);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
    };
    window.addEventListener('resize', handleResize);

    // Particle settings
    const particlesArray = [];
    const numberOfParticles = Math.min(Math.floor((width * height) / 9000), 100);
    const maxConnectionDistance = 120;

    let mouse = { x: null, y: null, radius: 150 };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    canvas.parentElement.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement.addEventListener('mouseleave', handleMouseLeave);

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.size = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce on boundaries
        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;

        // Mouse interaction attraction
        if (mouse.x != null && mouse.y != null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.hypot(dx, dy);
          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= dx * force * 0.03;
            this.y -= dy * force * 0.03;
          }
        }
      }

      draw() {
        ctx.fillStyle = '#d4a017';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push(new Particle());
    }

    const connect = () => {
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const distance = Math.hypot(dx, dy);

          if (distance < maxConnectionDistance) {
            const opacity = (maxConnectionDistance - distance) / maxConnectionDistance;
            ctx.strokeStyle = `rgba(212, 160, 23, ${opacity * 0.15})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particlesArray.forEach((p) => {
        p.update();
        p.draw();
      });
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvas.parentElement) {
        canvas.parentElement.removeEventListener('mousemove', handleMouseMove);
        canvas.parentElement.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [loading]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setContactError('Please complete all required fields.');
      return;
    }

    setSending(true);
    setContactSuccess('');
    setContactError('');

    try {
      const res = await fetch('/api/content/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });
      const resData = await res.json();
      if (res.ok) {
        setContactSuccess(resData.message || 'Support inquiry registered successfully.');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setContactError(resData.error || 'Failed to submit query.');
      }
    } catch (err) {
      setContactError('API gateway offline. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  // Static Fallbacks in case CMS databases lists are unpopulated
  const fallbackServices = [
    { title: 'Electronic Procurement', description: 'Consolidated microchip, controller and discrete components sourcing from worldwide inventories.', features: ['BOM Sourcing', 'Custom Shipping', 'Wholesale Price-matches'] },
    { title: 'Custom 3D Fabrication', description: 'Rapid additive prototyping and production-grade parts manufacturing with mechanical validation.', features: ['FDM & SLA Printing', 'Drafting Services', 'Precision Tolerances'] },
    { title: 'Web App Engineering', description: 'Secure, low-latency, modular React & API gateway restructures tailored for modern startups.', features: ['Clean Architectures', 'Audited Security Trails', 'Sub-millisecond API Speeds'] }
  ];

  const fallbackTeam = [
    { name: 'Zenith Kandel', role: 'Managing Director & Lead Architect', bio: 'Directs systems modular structures integrations and core database operations.' },
    { name: 'Himalix Engineering', role: 'Support & Fabrication Crew', bio: 'Validates 3D CAD meshes, organizes logistics registries and supports e-commerce items.' }
  ];

  const services = data.services.length > 0 ? data.services : fallbackServices;
  const team = data.team.length > 0 ? data.team : fallbackTeam;
  const testimonials = data.testimonials;

  return (
    <div className="landing-layout">
      {/* Hero Section */}
      <section className="hero-section" style={{ overflow: 'hidden' }}>
        <canvas ref={canvasRef} className="interactive-canvas" />
        <div className="container hero-content">
          <h1>{data.sections.hero?.hero_title || 'Precision Systems & Electronics'}</h1>
          <p>{data.sections.hero?.hero_description || 'Himalix Labs integrates international procurement chains, custom 3D printing pipelines, and secure modular web apps.'}</p>
          <div className="hero-actions">
            <a href="#services" className="btn" style={{ background: 'var(--accent-gold)', color: '#0a0a0a' }}>Our Solutions</a>
            <a href="#contact" className="btn btn-secondary">Get In Touch</a>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="section container">
        <div className="section-header">
          <h2>Our Sub-Modules & Services</h2>
          <p>Explore what we engineer at Himalix Labs</p>
        </div>
        <div className="services-grid">
          {services.map((s, idx) => (
            <div key={idx} className="service-card">
              <div className="service-icon">
                <i className={`fa-light fa-sharp ${s.icon_class || 'fa-gear'}`}></i>
              </div>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              <ul className="service-features">
                {s.features && s.features.map((f, fIdx) => (
                  <li key={fIdx}>
                    <i className="fa-light fa-sharp fa-check"></i>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section container">
        <div className="about-grid">
          <div className="about-text">
            <h3>{data.sections.about?.about_title || 'Sleek, Secure, Scalable Core Architecture'}</h3>
            <p>{data.sections.about?.about_description || 'We avoid unified, bloated database systems. By isolating databases for auth, store, CMS, and portfolios, Himalix Labs enforces strict data boundaries, high concurrency locks, and transaction integrity.'}</p>
          </div>
          <div style={{ padding: '30px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', marginBottom: '16px', color: 'var(--accent-gold)' }}>Security Guardrails</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <li><i className="fa-light fa-sharp fa-lock" style={{ marginRight: '8px', color: 'var(--accent-gold)' }}></i> Atomic Wallet Balance Updates</li>
              <li><i className="fa-light fa-sharp fa-shield" style={{ marginRight: '8px', color: 'var(--accent-gold)' }}></i> SQL Concurrency Row locking</li>
              <li><i className="fa-light fa-sharp fa-envelope-open" style={{ marginRight: '8px', color: 'var(--accent-gold)' }}></i> Automated Session Log Auditing</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Team section */}
      <section id="team" className="section container">
        <div className="section-header">
          <h2>Founders & Engineers</h2>
          <p>Our dedicated engineering board</p>
        </div>
        <div className="team-grid">
          {team.map((t, idx) => (
            <div key={idx} className="team-card">
              <div className="team-image">
                <i className="fa-light fa-sharp fa-user"></i>
              </div>
              <div className="team-info">
                <h3>{t.name}</h3>
                <p>{t.role}</p>
                <div className="team-bio">{t.bio}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Slider */}
      {testimonials.length > 0 && (
        <section className="section container">
          <div className="section-header">
            <h2>Client Testimonials</h2>
            <p>What startups and fabrication teams say about us</p>
          </div>
          <div className="testimonials-slider">
            {testimonials.map((t) => (
              <div key={t.id} className="testimonial-card">
                <div className="testimonial-rating">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <i key={i} className="fa-light fa-sharp fa-star"></i>
                  ))}
                </div>
                <div className="testimonial-content">"{t.content}"</div>
                <div className="testimonial-client">
                  <div className="client-meta">
                    <h4>{t.client_name}</h4>
                    <p>{t.client_title}, {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="section container">
        <div className="contact-grid">
          <div className="contact-info">
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <h2>Get In Touch</h2>
              <p>Submit your fabrication specifications or BOM list</p>
            </div>
            <div className="contact-item">
              <h4>Direct Inquiries</h4>
              <p>info@himalixlab.com</p>
            </div>
            <div className="contact-item">
              <h4>Operation Center</h4>
              <p>Kathmandu, Nepal</p>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '40px' }}>
            {contactSuccess && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', fontSize: '13px', marginBottom: '20px' }}>
                {contactSuccess}
              </div>
            )}
            {contactError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', fontSize: '13px', marginBottom: '20px' }}>
                {contactError}
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="contact-form">
              <div className="form-group">
                <label>Your Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={sending} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={sending} />
              </div>
              <div className="form-group full-width">
                <label>Subject</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={sending} />
              </div>
              <div className="form-group full-width">
                <label>Message Requirements</label>
                <textarea rows="5" value={message} onChange={(e) => setMessage(e.target.value)} required disabled={sending} style={{ resize: 'none' }}></textarea>
              </div>
              <div className="form-group full-width" style={{ marginTop: '10px' }}>
                <button type="submit" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
