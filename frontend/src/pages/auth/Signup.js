import React from 'react';

const Signup = () => {
  return (
    <div className="container" style={{ padding: '80px 0', maxWidth: '400px' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '24px' }}>Create Account</h2>
      <form>
        <div style={{ marginBottom: '16px' }}>
          <input type="email" placeholder="Email Address" required />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <input type="password" placeholder="Password" required />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <input type="text" placeholder="Referral Code (Optional)" />
        </div>
        <button type="submit" style={{ width: '100%' }}>Register</button>
      </form>
    </div>
  );
};

export default Signup;
