import React from 'react';

const Logo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--text-primary)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent'
        }}>
            <span style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: '900',
                fontSize: '1.5rem',
                color: 'var(--text-primary)',
                lineHeight: 1
            }}>M</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{
                margin: 0,
                fontSize: '1.6rem',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-primary)',
                lineHeight: '1.1'
            }}>
                Makalmy
            </h1>
            <span style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-text)',
                lineHeight: '1'
            }}>
                Stock
            </span>
        </div>
    </div>
);

export default Logo;
