// Extract profile ID from URL path
function getProfileIdFromUrl() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p); // Remove empty strings
    const profileId = parts[parts.length - 1];
    return profileId && profileId !== 'api' && profileId !== 'docs' ? profileId : 'demo';
}

// Cache for profile data to prevent unnecessary reloads
let cachedProfileData = null;
let lastProfileHash = null;

// Get visitor's position from their user account (stored at signup)
function getVisitorPosition() {
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            return userData.position || 'guest';
        } catch (e) {
            return 'guest';
        }
    }
    return 'guest'; // Default for non-logged-in visitors
}

// Initialize role display (show logged-in user's position)
function initRoleSelector() {
    const roleSelector = document.getElementById('role-selector');
    const user = localStorage.getItem('user');
    
    if (user) {
        try {
            const userData = JSON.parse(user);
            const position = userData.position || 'guest';
            const positionEmoji = {
                'guest': '👤',
                'student': '🎓',
                'developer': '💻',
                'hr': '👔',
                'admin': '🛡️'
            }[position] || '👤';
            
            roleSelector.innerHTML = `
                <div class="current-role">
                    <span>Viewing as: <strong>${positionEmoji} ${position}</strong></span>
                </div>
            `;
        } catch (e) {
            roleSelector.style.display = 'none';
        }
    } else {
        // Not logged in - show as guest
        roleSelector.innerHTML = `
            <div class="current-role">
                <span>Viewing as: <strong>👤 guest</strong></span>
                <a href="/auth.html" class="change-role-btn">Login to change</a>
            </div>
        `;
    }
}

// Format location info
function formatLocationInfo(country, city) {
    if (country && city) {
        return `${city}, ${country}`;
    } else if (country) {
        return country;
    }
    return 'Unknown';
}

// Display visitor information
function displayVisitorInfo(visitorContext) {
    const infoDiv = document.getElementById('visitor-info');
    
    const items = [];
    if (visitorContext.country) {
        items.push(`<span class="visitor-info-item">📍 <span class="visitor-info-label">Location:</span> <span class="visitor-info-value">${formatLocationInfo(visitorContext.country, visitorContext.city)}</span></span>`);
    }
    if (visitorContext.device_type) {
        const deviceEmoji = {
            'mobile': '📱',
            'tablet': '📊',
            'desktop': '🖥️'
        }[visitorContext.device_type] || '💻';
        items.push(`<span class="visitor-info-item">${deviceEmoji} <span class="visitor-info-label">Device:</span> <span class="visitor-info-value">${visitorContext.device_type}</span></span>`);
    }
    if (visitorContext.user_group) {
        items.push(`<span class="visitor-info-item">👤 <span class="visitor-info-label">Group:</span> <span class="visitor-info-value">${visitorContext.user_group}</span></span>`);
    }
    
    if (items.length > 0) {
        infoDiv.innerHTML = items.join('');
    }
}

// Display profile
function displayProfile(profile, visitorContext) {
    const profileSection = document.getElementById('profile-section');
    
    let html = '';
    const avatarSeed = encodeURIComponent(profile.id || profile.title || 'user');
    const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
    html += `<img src="${profile.avatar_url || fallbackAvatar}" alt="Avatar" class="profile-avatar">`;
    html += `<h1 class="profile-title">${profile.title}</h1>`;
    if (profile.bio) {
        html += `<p class="profile-bio">${profile.bio}</p>`;
    }
    
    profileSection.innerHTML = html;
    
    displayVisitorInfo(visitorContext);
}

// Display links
function displayLinks(links) {
    const linksSection = document.getElementById('links-section');
    
    // Filter links: Show only links that either have no rules OR are highlighted
    const visibleLinks = links.filter(link => {
        // If link has no rules, always show it
        if (!link.rules || link.rules.length === 0) {
            return true;
        }
        // If link has rules, only show if highlighted (rules matched)
        return link.is_highlighted;
    });
    
    if (visibleLinks.length === 0) {
        linksSection.innerHTML = '<p class="error">No links available for your current context</p>';
        return;
    }
    
    let html = '';
    visibleLinks.forEach(link => {
        const highlighted = link.is_highlighted ? 'highlighted' : '';
        const highlightBadge = link.is_highlighted ? '<span class="badge">✨ Featured</span>' : '';
        const linkTitle = link.title || `Link ${link.id}`;
        
        html += `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="link-card ${highlighted}" data-link-id="${link.id}">
                <div class="link-content">
                    <div style="display: flex; align-items: center; flex: 1;">
                        ${link.icon ? `<span class="link-icon">${link.icon}</span>` : ''}
                        <div class="link-info">
                            <div class="link-title">${linkTitle}${highlightBadge}</div>
                            ${link.description ? `<p class="link-description">${link.description}</p>` : ''}
                        </div>
                    </div>
                    <span class="link-arrow">→</span>
                </div>
            </a>
        `;
    });
    
    linksSection.innerHTML = html;
    
    // Add click tracking
    document.querySelectorAll('.link-card').forEach(card => {
        card.addEventListener('click', () => {
            const linkId = card.dataset.linkId;
            trackClick(linkId);
        });
    });
}

// Track link clicks
async function trackClick(linkId) {
    try {
        const profileId = getProfileIdFromUrl();
        const visitorId = getOrCreateVisitorId();
        
        // Use keepalive to ensure request completes even if page navigates
        await fetch(`/api/profiles/${profileId}/track-click/${linkId}?visitor_id=${visitorId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            keepalive: true
        });
    } catch (error) {
        console.error('Error tracking click:', error);
    }
}

// Get or create a unique visitor ID for this session
function getOrCreateVisitorId() {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
}

// Load profile data
async function loadProfile() {
    try {
        const profileId = getProfileIdFromUrl();
        const position = getVisitorPosition();
        const url = `/api/profiles/${profileId}?user_group=${encodeURIComponent(position)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Profile not found');
        }
        
        const data = await response.json();
        
        // Generate hash of profile data to check if it changed
        const currentHash = JSON.stringify(data.profile.links);
        
        // Only redraw if links have actually changed
        if (currentHash !== lastProfileHash) {
            lastProfileHash = currentHash;
            displayProfile(data.profile, data.visitor_context);
            displayLinks(data.profile.links);
        }
        
        cachedProfileData = data;
    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('profile-section').innerHTML = 
            `<p class="error">❌ Error loading profile: ${error.message}</p>`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initRoleSelector();
    loadProfile();
});

// Reload profile every 30 seconds to check for updates, but only redraw if data changed
setInterval(loadProfile, 30000);
