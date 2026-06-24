let currentUser = null;
let currentProfile = null;
let analyticsWebSocket = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth.html';
    } else {
        loadDashboard();
    }
});

async function loadDashboard() {
    const token = localStorage.getItem('token');
    
    try {
        // Get current user
        const userResponse = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!userResponse.ok) {
            localStorage.removeItem('token');
            window.location.href = '/auth.html';
            return;
        }
        
        currentUser = await userResponse.json();
        
        // Show admin panel if user is admin
        if (currentUser && currentUser.position === 'admin') {
            const adminItems = document.querySelectorAll('.admin-only');
            adminItems.forEach(item => {
                item.style.display = 'flex';
            });
            console.log('✅ Admin panel enabled for user:', currentUser.username);
        }
        
        // Get user's dashboard
        const dashResponse = await fetch('/api/profiles/me/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (dashResponse.ok) {
            const data = await dashResponse.json();
            currentProfile = data.profile;
            loadProfileForm();
            loadLinksList();
            loadAnalyticsQuick();
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function switchTab(tab) {
    // Hide all tabs with a slight delay for smooth transition
    const currentActive = document.querySelector('.tab-content.active');
    const newTab = document.getElementById(tab + '-tab');
    
    if (currentActive && currentActive !== newTab) {
        currentActive.classList.remove('active');
    }
    
    // Show selected tab
    requestAnimationFrame(() => {
        newTab.classList.add('active');
    });
    
    console.log('Switching to tab:', tab);
    
    if (tab === 'browse') {
        loadBrowseProfiles();
    } else if (tab === 'analytics') {
        loadAnalyticsQuick();
    } else if (tab === 'admin') {
        console.log('Loading admin panel...');
        loadAdminPanel();
    }
}

function loadProfileForm() {
    console.log('Loading profile form with data:', currentProfile);
    
    document.getElementById('profile-title').value = currentProfile.title || '';
    document.getElementById('profile-bio').value = currentProfile.bio || '';
    document.getElementById('profile-avatar').value = currentProfile.avatar_url || '';
    
    // Set view profile link
    const profileUrl = `${window.location.origin}/${currentProfile.id}`;
    document.getElementById('view-profile-link').href = profileUrl;
    
    // Load position application status
    loadPositionStatus();
}

async function updateProfile(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;
    }
    
    const profile = {
        id: currentProfile.id,
        title: document.getElementById('profile-title').value,
        bio: document.getElementById('profile-bio').value,
        avatar_url: document.getElementById('profile-avatar').value,
        links: currentProfile.links,
        theme: 'light'
    };
    
    console.log('Saving profile:', profile);
    
    try {
        const response = await fetch('/api/profiles/me/profile', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profile)
        });
        
        if (response.ok) {
            const updated = await response.json();
            console.log('Profile saved successfully:', updated);
            currentProfile = updated;
            
            // Reload the form to show updated values
            loadProfileForm();
            
            // Show success message with visual feedback
            if (submitBtn) {
                submitBtn.textContent = '✓ Saved!';
                submitBtn.style.background = '#00ff41';
                submitBtn.style.color = '#0a0e27';
                
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                    submitBtn.style.color = '';
                }, 2000);
            }
            
            const s = document.getElementById('profile-success'); if(s){s.textContent='Profile saved successfully.';s.style.display='flex';setTimeout(()=>s.style.display='none',3000);}
        } else {
            const errorData = await response.json().catch(() => ({}));
            alert('Error updating profile: ' + (errorData.detail || 'Unknown error'));
            
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile: ' + error.message);
        
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}

function showAddLinkForm() {
    document.getElementById('add-link-form').style.display = 'block';
}

function hideAddLinkForm() {
    document.getElementById('add-link-form').style.display = 'none';
    document.getElementById('link-form').reset();
    document.getElementById('rule-value-group').style.display = 'none';
}

function updateRuleValuePlaceholder() {
    const ruleType = document.getElementById('link-rule-type').value;
    const valueGroup = document.getElementById('rule-value-group');
    const valueInput = document.getElementById('link-rule-value');
    const helpText = document.getElementById('rule-value-help');
    
    if (!ruleType) {
        valueGroup.style.display = 'none';
        valueInput.value = '';
        return;
    }
    
    valueGroup.style.display = 'block';
    
    const ruleConfig = {
        'time': {
            placeholder: '09:00-17:00',
            help: 'Format: HH:MM-HH:MM (24-hour). Link highlighted during this time range.'
        },
        'location': {
            placeholder: 'US',
            help: 'Country code (e.g., US, UK, IN) or "US,New York" for city-specific.'
        },
        'device': {
            placeholder: 'mobile',
            help: 'Options: mobile, tablet, or desktop'
        },
        'day': {
            placeholder: 'MON,WED,FRI',
            help: 'Days: MON, TUE, WED, THU, FRI, SAT, SUN (comma-separated)'
        },
        'user_group': {
            placeholder: 'developer',
            help: 'Position: hr, student, developer, admin, or guest'
        }
    };
    
    const config = ruleConfig[ruleType] || { placeholder: '', help: '' };
    valueInput.placeholder = config.placeholder;
    helpText.textContent = config.help;
}

async function addLink(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    
    const rules = [];
    const ruleType = document.getElementById('link-rule-type').value;
    if (ruleType) {
        rules.push({
            rule_type: ruleType,
            value: document.getElementById('link-rule-value').value,
            priority: 1
        });
    }
    
    const link = {
        title: document.getElementById('link-title').value,
        url: document.getElementById('link-url').value,
        description: document.getElementById('link-description').value,
        icon: document.getElementById('link-icon').value,
        is_active: true,
        is_highlighted: false,
        rules: rules,
        click_count: 0
    };
    
    try {
        const response = await fetch('/api/profiles/me/links', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(link)
        });
        
        if (response.ok) {
            const updated = await response.json();
            currentProfile = updated;
            loadLinksList();
            hideAddLinkForm();
            alert('Link added successfully');
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Server error: ${response.status}`);
        }
    } catch (error) {
        console.error('Error details:', error);
        alert('Error adding link: ' + error.message);
    }
}

async function deleteLink(linkId) {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/profiles/me/links/${linkId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const updated = await response.json();
            currentProfile = updated;
            loadLinksList();
            alert('Link deleted successfully');
        }
    } catch (error) {
        alert('Error deleting link: ' + error.message);
    }
}

function loadLinksList() {
    const container = document.getElementById('links-list');
    if (!currentProfile.links || currentProfile.links.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔗</div><div class="empty-state-title">No links yet</div><div class="empty-state-desc">Click "Add Link" above to create your first link.</div></div>';
        return;
    }
    let html = '';
    currentProfile.links.forEach(link => {
        const rulesJson = JSON.stringify(link.rules || []).replace(/"/g, '&quot;');
        const ruleLabel = (link.rules && link.rules.length > 0) ? '<span class="rule-badge">' + link.rules[0].rule_type + '</span>' : '';
        html += '<div class="link-card" id="link-item-' + link.id + '">'
            + '<div class="link-card-icon">' + (link.icon || '🔗') + '</div>'
            + '<div class="link-card-body">'
            + '<div class="link-card-title">' + link.title + '</div>'
            + '<div class="link-card-url"><a href="' + link.url + '" target="_blank">' + link.url + '</a></div>'
            + '<div class="link-card-meta">' + (link.description ? '<span style="font-size:0.78rem;color:var(--gray-400)">' + link.description + '</span>' : '') + ruleLabel + '</div>'
            + '</div>'
            + '<div class="link-card-actions">'
            + '<button class="btn btn-sm btn-secondary" onclick="showEditLinkForm('' + link.id + '', '' + link.title.replace(/'/g, "\'") + '', '' + link.url + '', '' + (link.description || '').replace(/'/g, "\'") + '', '' + (link.icon || '') + '', '' + rulesJson + '')">Edit</button>'
            + '<button class="btn btn-sm btn-danger" onclick="deleteLink('' + link.id + '')">Delete</button>'
            + '</div>'
            + '</div>';
    });
    container.innerHTML = html;
}

function showEditLinkForm(linkId, title, url, description, icon, rulesJson) {
    // Parse rules
    let rules = [];
    try {
        rules = JSON.parse(rulesJson.replace(/&quot;/g, '"'));
    } catch (e) {
        rules = [];
    }
    
    const ruleType = rules.length > 0 ? rules[0].rule_type : '';
    const ruleValue = rules.length > 0 ? rules[0].value : '';
    
    // Get help text for current rule type
    const ruleConfig = {
        'time': { placeholder: '09:00-17:00', help: 'Format: HH:MM-HH:MM (24-hour)' },
        'location': { placeholder: 'US', help: 'Country code (e.g., US, UK, IN)' },
        'device': { placeholder: 'mobile', help: 'Options: mobile, tablet, or desktop' },
        'day': { placeholder: 'MON,WED,FRI', help: 'Days: MON, TUE, WED, THU, FRI, SAT, SUN' },
        'user_group': { placeholder: 'developer', help: 'Position: hr, student, developer, admin, or guest' }
    };
    const config = ruleConfig[ruleType] || { placeholder: '', help: '' };
    const showRuleValue = ruleType ? 'block' : 'none';
    
    const formHtml = `
        <div class="edit-link-form" id="edit-form-${linkId}">
            <h4>Edit Link</h4>
            <div class="form-group">
                <label>Title</label>
                <input type="text" id="edit-link-title-${linkId}" value="${title}" required>
            </div>
            <div class="form-group">
                <label>URL</label>
                <input type="url" id="edit-link-url-${linkId}" value="${url}" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <input type="text" id="edit-link-description-${linkId}" value="${description}">
            </div>
            <div class="form-group">
                <label>Icon (Emoji)</label>
                <input type="text" id="edit-link-icon-${linkId}" value="${icon}" placeholder="🎨">
            </div>
            <div class="form-group">
                <label>Rule Type</label>
                <select id="edit-link-rule-type-${linkId}" onchange="updateEditRuleValuePlaceholder('${linkId}')">
                    <option value="" ${!ruleType ? 'selected' : ''}>None</option>
                    <option value="time" ${ruleType === 'time' ? 'selected' : ''}>Time-based</option>
                    <option value="location" ${ruleType === 'location' ? 'selected' : ''}>Location-based</option>
                    <option value="device" ${ruleType === 'device' ? 'selected' : ''}>Device-based</option>
                    <option value="day" ${ruleType === 'day' ? 'selected' : ''}>Day-based</option>
                    <option value="user_group" ${ruleType === 'user_group' ? 'selected' : ''}>Position</option>
                </select>
            </div>
            <div class="form-group" id="edit-rule-value-group-${linkId}" style="display:${showRuleValue};">
                <label>Rule Value</label>
                <input type="text" id="edit-link-rule-value-${linkId}" value="${ruleValue}" placeholder="${config.placeholder}">
                <small id="edit-rule-value-help-${linkId}" class="form-help">${config.help}</small>
            </div>
            <div class="form-actions">
                <button class="btn btn-primary btn-small" onclick="saveEditedLink('${linkId}')">Save</button>
                <button class="btn btn-secondary btn-small" onclick="cancelEditLink('${linkId}')">Cancel</button>
            </div>
        </div>
    `;
    
    const linkItem = document.getElementById(`link-item-${linkId}`);
    linkItem.innerHTML += formHtml;
    linkItem.querySelector('.link-card-body').style.display = 'none';
    linkItem.querySelector('.link-card-icon').style.display = 'none';
    linkItem.querySelector('.link-card-actions').style.display = 'none';
}

function saveEditedLink(linkId) {
    const token = localStorage.getItem('token');
    
    const rules = [];
    const ruleType = document.getElementById(`edit-link-rule-type-${linkId}`).value;
    if (ruleType) {
        rules.push({
            rule_type: ruleType,
            value: document.getElementById(`edit-link-rule-value-${linkId}`).value,
            priority: 1
        });
    }
    
    const link = {
        title: document.getElementById(`edit-link-title-${linkId}`).value,
        url: document.getElementById(`edit-link-url-${linkId}`).value,
        description: document.getElementById(`edit-link-description-${linkId}`).value,
        icon: document.getElementById(`edit-link-icon-${linkId}`).value,
        is_active: true,
        is_highlighted: false,
        rules: rules
    };
    
    fetch(`/api/profiles/me/links/${linkId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(link)
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to update link');
    }).then(updated => {
        currentProfile = updated;
        loadLinksList();
        alert('Link updated successfully');
    }).catch(error => {
        alert('Error updating link: ' + error.message);
    });
}

function cancelEditLink(linkId) {
    const linkItem = document.getElementById(`link-item-${linkId}`);
    const editForm = document.getElementById(`edit-form-${linkId}`);
    if (editForm) {
        editForm.remove();
    }
    linkItem.querySelector('.link-card-body').style.display = '';
    linkItem.querySelector('.link-card-icon').style.display = '';
    linkItem.querySelector('.link-card-actions').style.display = '';
}

function updateEditRuleValuePlaceholder(linkId) {
    const ruleType = document.getElementById(`edit-link-rule-type-${linkId}`).value;
    const valueGroup = document.getElementById(`edit-rule-value-group-${linkId}`);
    const valueInput = document.getElementById(`edit-link-rule-value-${linkId}`);
    const helpText = document.getElementById(`edit-rule-value-help-${linkId}`);
    
    if (!ruleType) {
        valueGroup.style.display = 'none';
        return;
    }
    
    valueGroup.style.display = 'block';
    
    const ruleConfig = {
        'time': { placeholder: '09:00-17:00', help: 'Format: HH:MM-HH:MM (24-hour)' },
        'location': { placeholder: 'US', help: 'Country code (e.g., US, UK, IN)' },
        'device': { placeholder: 'mobile', help: 'Options: mobile, tablet, or desktop' },
        'day': { placeholder: 'MON,WED,FRI', help: 'Days: MON, TUE, WED, THU, FRI, SAT, SUN' },
        'user_group': { placeholder: 'developer', help: 'Position: hr, student, developer, admin, or guest' }
    };
    const config = ruleConfig[ruleType] || { placeholder: '', help: '' };
    valueInput.placeholder = config.placeholder;
    helpText.textContent = config.help;
}

let allProfiles = []; // Store all profiles for searching

async function loadBrowseProfiles() {
    try {
        // Always fetch fresh data from server
        const response = await fetch('/api/profiles/');
        if (response.ok) {
            allProfiles = await response.json();
            displayProfiles(allProfiles);
            
            // Add real-time search event listener (only once)
            const searchInput = document.getElementById('profile-search');
            if (searchInput && !searchInput.hasAttribute('data-listener-added')) {
                searchInput.addEventListener('input', performSearch);
                searchInput.setAttribute('data-listener-added', 'true');
            }
        }
    } catch (error) {
        console.error('Error loading profiles:', error);
    }
}

function displayProfiles(profiles) {
    const filtered = profiles.filter(p => p.id !== currentUser.id);
    if (filtered.length === 0) {
        document.getElementById('profiles-list').innerHTML = '<div class="empty-state"><div class="empty-state-icon">🌍</div><div class="empty-state-title">No profiles found</div><div class="empty-state-desc">Be the first to create a public profile!</div></div>';
        return;
    }
    let html = '';
    filtered.forEach(profile => {
        const initials = (profile.title || 'U').slice(0, 2).toUpperCase();
        const linkCount = (profile.links || []).length;
        html += '<a class="profile-card-thumb" href="/' + profile.id + '" target="_blank">'
            + '<div class="profile-thumb-avatar">' + initials + '</div>'
            + '<div class="profile-thumb-name">' + (profile.title || 'Unnamed') + '</div>'
            + '<div class="profile-thumb-bio">' + (profile.bio || 'No bio') + '</div>'
            + '<div style="font-size:0.75rem;color:var(--gray-400);margin-top:6px;">' + linkCount + ' link' + (linkCount !== 1 ? 's' : '') + '</div>'
            + '</a>';
    });
    document.getElementById('profiles-list').innerHTML = html;
}
function searchProfiles() {
    performSearch();
}

function performSearch() {
    const searchTerm = document.getElementById('profile-search').value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayProfiles(allProfiles);
        return;
    }
    
    const filteredProfiles = allProfiles.filter(profile => {
        if (profile.id === currentUser.id) return false; // Don't show own profile
        
        const titleMatch = profile.title && profile.title.toLowerCase().includes(searchTerm);
        const bioMatch = profile.bio && profile.bio.toLowerCase().includes(searchTerm);
        const idMatch = profile.id && profile.id.toLowerCase().includes(searchTerm);
        
        return titleMatch || bioMatch || idMatch;
    });
    
    displayProfiles(filteredProfiles);
}

function clearSearch() {
    document.getElementById('profile-search').value = '';
    displayProfiles(allProfiles);
}

function viewProfile(profileId) {
    window.location.href = `/${profileId}`;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth.html';
}

function showQRCode() {
    if (!currentProfile || !currentProfile.id) {
        alert('Profile not loaded yet');
        return;
    }
    
    const profileUrl = `${window.location.origin}/${currentProfile.id}`;
    const container = document.getElementById('qr-code-container');
    container.innerHTML = '';
    
    // Generate QR code using qrcodejs library
    new QRCode(container, {
        text: profileUrl,
        width: 256,
        height: 256,
        colorDark: '#00ff41',
        colorLight: '#0a0e27',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    document.getElementById('qr-profile-url').textContent = profileUrl;
    document.getElementById('qr-modal').style.display = 'flex';
}

function closeQRModal() {
    document.getElementById('qr-modal').style.display = 'none';
}

function downloadQRCode() {
    const container = document.getElementById('qr-code-container');
    const img = container.querySelector('img');
    const canvas = container.querySelector('canvas');
    
    if (img) {
        const link = document.createElement('a');
        link.download = `${currentProfile.id}-qrcode.png`;
        link.href = img.src;
        link.click();
    } else if (canvas) {
        const link = document.createElement('a');
        link.download = `${currentProfile.id}-qrcode.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } else {
        alert('QR code not generated yet');
    }
}

async function loadAnalyticsQuick() {
    if (!currentProfile || !currentProfile.id) {
        console.error('Current profile not available');
        return;
    }
    
    // Connect to WebSocket for real-time updates
    connectAnalyticsWebSocket();
}

function connectAnalyticsWebSocket() {
    if (analyticsWebSocket && analyticsWebSocket.readyState === WebSocket.OPEN) {
        return; // Already connected
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/analytics/${currentProfile.id}`;
    
    analyticsWebSocket = new WebSocket(wsUrl);
    
    analyticsWebSocket.onopen = () => {
        console.log('Analytics WebSocket connected');
        // Send ping every 30 seconds to keep connection alive
        setInterval(() => {
            if (analyticsWebSocket && analyticsWebSocket.readyState === WebSocket.OPEN) {
                analyticsWebSocket.send('ping');
            }
        }, 30000);
    };
    
    analyticsWebSocket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'initial' || message.type === 'update') {
                displayAnalyticsQuick(message.data);
                // Show a subtle notification for updates
                if (message.type === 'update') {
                    showAnalyticsUpdateNotification();
                }
            }
        } catch (e) {
            console.error('Error parsing WebSocket message:', e);
        }
    };
    
    analyticsWebSocket.onclose = () => {
        console.log('Analytics WebSocket disconnected');
        // Reconnect after 5 seconds
        setTimeout(() => {
            if (currentProfile && currentProfile.id) {
                connectAnalyticsWebSocket();
            }
        }, 5000);
    };
    
    analyticsWebSocket.onerror = (error) => {
        console.error('Analytics WebSocket error:', error);
    };
}

function showAnalyticsUpdateNotification() {
    // Flash the analytics tab to indicate update
    const analyticsTab = document.getElementById('analytics-tab');
    if (analyticsTab) {
        analyticsTab.classList.add('analytics-updated');
        setTimeout(() => {
            analyticsTab.classList.remove('analytics-updated');
        }, 1000);
    }
}

function displayAnalyticsQuick(analytics) {
    let topLinkDisplay = 'N/A';
    if (analytics.links && analytics.links.length > 0) {
        const topLinkId = analytics.links[0].link_id;
        // Find the corresponding link in current profile to get the title
        const topLink = currentProfile.links.find(link => link.id === topLinkId);
        if (topLink && topLink.title) {
            topLinkDisplay = topLink.title.length > 20 ? topLink.title.substring(0, 20) + '...' : topLink.title;
        } else {
            topLinkDisplay = topLinkId.substring(0, 20);
        }
    }
    
    // Update stat cards directly
    const tc = document.getElementById('dash-total-clicks');
    const tv = document.getElementById('dash-total-visitors');
    const tl = document.getElementById('dash-top-link');
    if (tc) tc.textContent = analytics.total_clicks || 0;
    if (tv) tv.textContent = analytics.total_unique_visitors || 0;
    if (tl) tl.textContent = topLinkDisplay;

    let html = `
        
        <div class="analytics-links-table">
            <div class="section-header">
                <h4>Link Performance</h4>
                <div class="section-subtitle">Clicks per link comparison</div>
            </div>
            
            <div class="table-wrapper">
                <table class="analytics-table">
                    <thead>
                        <tr>
                            <th>Link Title</th>
                            <th>Total Clicks</th>
                            <th>Unique Visitors</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    if (analytics.links && analytics.links.length > 0) {
        analytics.links.forEach((link, index) => {
            const trendClass = link.clicks > 10 ? 'hot' : link.clicks > 5 ? 'positive' : link.clicks > 0 ? 'neutral' : 'low';
            const trendText = link.clicks > 10 ? '🔥 Hot' : link.clicks > 5 ? '📈 Rising' : link.clicks > 0 ? '➡️ Stable' : '📉 Low';
            
            // Find the actual link title from current profile
            const profileLink = currentProfile.links.find(profileLink => profileLink.id === link.link_id);
            const linkTitle = profileLink ? profileLink.title : link.link_id;
            
            html += `
                <tr class="table-row" style="animation-delay: ${index * 0.1}s">
                    <td class="link-cell">
                        <div class="link-info">
                            <span class="link-title">${linkTitle}</span>
                        </div>
                    </td>
                    <td class="metric-cell">
                        <div class="metric-display">
                            <span class="metric-number">${link.clicks || 0}</span>
                            <span class="trend-indicator ${trendClass}">${trendText}</span>
                        </div>
                    </td>
                    <td class="metric-cell">
                        <div class="metric-display">
                            <span class="metric-number">${link.unique_visitors || 0}</span>
                            <span class="ctr-rate">visitors</span>
                        </div>
                    </td>
                </tr>
            `;
        });
    } else {
        html += `
            <tr class="empty-state">
                <td colspan="3">
                    <div class="empty-message">
                        <span class="empty-icon">📊</span>
                        <h3>No link data yet</h3>
                        <p>Start sharing your links to see analytics data here</p>
                    </div>
                </td>
            </tr>
        `;
    }
    
    html += `
                    </tbody>
                </table>
            </div>
            <p><a href="/analytics.html" target="_blank" class="analytics-link">View Detailed Analytics →</a></p>
        </div>
    `;
    
    const analyticsTab = document.getElementById('analytics-tab');
    if (analyticsTab) {
        analyticsTab.innerHTML = html;
    }
}

function switchTabWithClose(tabName) {
    closeSidebar();
    switchTab(tabName);
    
    // Update active menu item
    const menuItems = document.querySelectorAll('.sidebar-item');
    menuItems.forEach(item => item.classList.remove('active'));
    event.target.closest('.sidebar-item')?.classList.add('active');
}

function closeSidebar() {
    // Implementation for closing sidebar if needed
}

// ============ ADMIN PANEL FUNCTIONS ============


async function loadAdminPanel() {
    const token = localStorage.getItem('token');
    
    try {
        // Load admin stats
        const statsResponse = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            document.getElementById('admin-total-users').textContent = stats.total_users;
            document.getElementById('admin-total-links').textContent = stats.total_links;
            document.getElementById('admin-pending-apps').textContent = stats.pending_applications;
            document.getElementById('admin-total-clicks').textContent = stats.total_clicks;
        }
        
        // Load all users
        const usersResponse = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            displayAdminUsers(users);
        }
        
        // Load all links
        const linksResponse = await fetch('/api/admin/links/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (linksResponse.ok) {
            const data = await linksResponse.json();
            displayAdminLinks(data.links);
        }
        
        // Load all profiles
        const profilesResponse = await fetch('/api/profiles/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (profilesResponse.ok) {
            const profiles = await profilesResponse.json();
            displayAdminProfiles(profiles);
        }
        
    } catch (error) {
        console.error('Error loading admin panel:', error);
    }
}

function displayAdminUsers(users) {
    if (!users || users.length === 0) {
        document.getElementById('admin-users-list').innerHTML = '<div class="empty-state"><div class="empty-state-title">No users found</div></div>';
        return;
    }
    let html = '';
    users.forEach(user => {
        const hasApplication = !!user.position_application;
        html += '<div class="user-admin-row" data-username="' + user.username.toLowerCase() + '" data-email="' + user.email.toLowerCase() + '">'
            + '<div class="user-admin-info">'
            + '<div class="user-admin-name">' + user.username + (user.position_verified ? ' <span class="badge badge-green">Verified</span>' : '') + '</div>'
            + '<div class="user-admin-email">' + user.email + '</div>'
            + '<div style="display:flex;gap:4px;margin-top:4px;">'
            + '<span class="badge badge-gray">' + user.role + '</span>'
            + '<span class="badge badge-blue">' + user.position + '</span>'
            + (hasApplication ? '<span class="badge badge-yellow">Applied: ' + user.position_application + '</span>' : '')
            + '</div>'
            + '</div>'
            + '<div class="user-admin-actions">'
            + (hasApplication ? '<button class="btn btn-sm btn-success" onclick="approvePosition('' + user.id + '')">Approve</button><button class="btn btn-sm btn-danger" onclick="rejectPosition('' + user.id + '')">Reject</button>' : '')
            + '<button class="btn btn-sm btn-secondary" onclick="showEditUserModal('' + user.id + '', '' + user.username + '', '' + user.role + '', '' + user.position + '', ' + user.position_verified + ')">Edit</button>'
            + (user.id !== currentUser.id ? '<button class="btn btn-sm btn-danger" onclick="deleteUser('' + user.id + '', '' + user.username + '')">Delete</button>' : '')
            + '</div>'
            + '</div>';
    });
    document.getElementById('admin-users-list').innerHTML = html;
}
function displayAdminLinks(links) {
    if (!links || links.length === 0) {
        document.getElementById('admin-all-links').innerHTML = '<div class="empty-state"><div class="empty-state-title">No links found</div></div>';
        return;
    }
    let html = '<table style="width:100%;border-collapse:collapse;font-size:0.875rem;"><thead><tr style="border-bottom:1px solid var(--gray-200);"><th style="padding:10px 14px;text-align:left;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--gray-400);">Title</th><th style="padding:10px 14px;text-align:left;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--gray-400);">Owner</th><th style="padding:10px 14px;text-align:left;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--gray-400);">Clicks</th></tr></thead><tbody>';
    links.forEach(link => {
        html += '<tr style="border-bottom:1px solid var(--gray-100);">'
            + '<td style="padding:10px 14px;color:var(--gray-700);font-weight:500;">' + link.link_title + '</td>'
            + '<td style="padding:10px 14px;color:var(--gray-400);font-size:0.8rem;">' + link.profile_title + '</td>'
            + '<td style="padding:10px 14px;color:var(--gray-700);">' + (link.click_count || 0) + '</td>'
            + '</tr>';
    });
    html += '</tbody></table>';
    document.getElementById('admin-all-links').innerHTML = html;
}html;
}

function filterAdminUsers() {
    const searchTerm = document.getElementById('admin-user-search').value.toLowerCase();
    const userCards = document.querySelectorAll('.admin-user-card');
    
    userCards.forEach(card => {
        const username = card.getAttribute('data-username');
        const email = card.getAttribute('data-email');
        
        if (username.includes(searchTerm) || email.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

async function approvePosition(userId) {
    const token = localStorage.getItem('token');
    
    if (!confirm('Approve this position application?')) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/approve-position`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            alert('Position approved successfully!');
            loadAdminPanel();
        } else {
            const error = await response.json();
            alert('Error: ' + error.detail);
        }
    } catch (error) {
        alert('Error approving position: ' + error.message);
    }
}

async function rejectPosition(userId) {
    const token = localStorage.getItem('token');
    
    if (!confirm('Reject this position application?')) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/reject-position`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            alert('Position application rejected.');
            loadAdminPanel();
        } else {
            const error = await response.json();
            alert('Error: ' + error.detail);
        }
    } catch (error) {
        alert('Error rejecting position: ' + error.message);
    }
}

function showEditUserModal(userId, username, role, position, verified) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>Edit User: ${username}</h3>
            <form id="edit-user-form" onsubmit="updateUser(event, '${userId}')">
                <div class="form-group">
                    <label>Role</label>
                    <select id="edit-user-role" required>
                        <option value="free" ${role === 'free' ? 'selected' : ''}>Free</option>
                        <option value="premium" ${role === 'premium' ? 'selected' : ''}>Premium</option>
                        <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Position</label>
                    <select id="edit-user-position" required>
                        <option value="guest" ${position === 'guest' ? 'selected' : ''}>Guest</option>
                        <option value="student" ${position === 'student' ? 'selected' : ''}>Student</option>
                        <option value="developer" ${position === 'developer' ? 'selected' : ''}>Developer</option>
                        <option value="hr" ${position === 'hr' ? 'selected' : ''}>HR</option>
                        <option value="admin" ${position === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="edit-user-verified" ${verified ? 'checked' : ''}>
                        Position Verified
                    </label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function updateUser(event, userId) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    
    const role = document.getElementById('edit-user-role').value;
    const position = document.getElementById('edit-user-position').value;
    const verified = document.getElementById('edit-user-verified').checked;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: role,
                position: position,
                position_verified: verified
            })
        });
        
        if (response.ok) {
            alert('User updated successfully!');
            document.querySelector('.modal').remove();
            loadAdminPanel();
        } else {
            const error = await response.json();
            alert('Error: ' + error.detail);
        }
    } catch (error) {
        alert('Error updating user: ' + error.message);
    }
}

async function deleteUser(userId, username) {
    const token = localStorage.getItem('token');
    
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            alert('User deleted successfully!');
            
            // Reload admin panel
            loadAdminPanel();
            
            // Clear cached profiles and reload browse profiles if that tab is active
            allProfiles = [];
            const browseTab = document.getElementById('browse-tab');
            if (browseTab && browseTab.classList.contains('active')) {
                loadBrowseProfiles();
            }
        } else {
            const error = await response.json();
            alert('Error: ' + error.detail);
        }
    } catch (error) {
        alert('Error deleting user: ' + error.message);
    }
}


// ============ POSITION APPLICATION FUNCTIONS ============

function loadPositionStatus() {
    const statusDiv = document.getElementById('position-status');
    const applyForm = document.getElementById('position-apply-form');
    
    if (!currentUser) return;
    
    const position = currentUser.position || 'guest';
    const application = currentUser.position_application;
    const verified = currentUser.position_verified;
    
    let statusHtml = '';
    
    if (position === 'admin') {
        statusHtml = `
            <div class="status-badge status-admin">
                <span class="status-icon">🛡️</span>
                <div>
                    <strong>Administrator</strong>
                    <p>You have full admin access to the platform.</p>
                </div>
            </div>
        `;
        applyForm.style.display = 'none';
    } else if (application) {
        statusHtml = `
            <div class="status-badge status-pending">
                <span class="status-icon">⏳</span>
                <div>
                    <strong>Application Pending</strong>
                    <p>You applied for: <strong>${application}</strong></p>
                    <p>Waiting for admin approval...</p>
                </div>
            </div>
        `;
        applyForm.style.display = 'none';
    } else if (position !== 'guest' && verified) {
        statusHtml = `
            <div class="status-badge status-verified">
                <span class="status-icon">✓</span>
                <div>
                    <strong>Position Verified</strong>
                    <p>Current position: <strong>${position}</strong></p>
                    <p>Your position has been verified by an administrator.</p>
                </div>
            </div>
        `;
        applyForm.style.display = 'none';
    } else if (position !== 'guest' && !verified) {
        statusHtml = `
            <div class="status-badge status-unverified">
                <span class="status-icon">⚠️</span>
                <div>
                    <strong>Position Not Verified</strong>
                    <p>Current position: <strong>${position}</strong></p>
                    <p>Your position needs admin verification to access special features.</p>
                </div>
            </div>
        `;
        applyForm.style.display = 'block';
    } else {
        statusHtml = `
            <div class="status-badge status-guest">
                <span class="status-icon">👤</span>
                <div>
                    <strong>Guest User</strong>
                    <p>Apply for a position to access special features and links.</p>
                </div>
            </div>
        `;
        applyForm.style.display = 'block';
    }
    
    statusDiv.innerHTML = statusHtml;
}

async function applyForPosition() {
    const token = localStorage.getItem('token');
    const position = document.getElementById('apply-position').value;
    
    if (!position) {
        alert('Please select a position to apply for.');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/me/apply-position', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ position: position })
        });
        
        if (response.ok) {
            const updatedUser = await response.json();
            currentUser = updatedUser;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            alert('Application submitted successfully! An administrator will review your request.');
            loadPositionStatus();
        } else {
            const error = await response.json();
            alert('Error: ' + error.detail);
        }
    } catch (error) {
        alert('Error submitting application: ' + error.message);
    }
}


function displayAdminProfiles(profiles) {
    let html = '<div class="admin-profiles-table">';
    
    if (profiles.length === 0) {
        html += '<p>No profiles found.</p>';
    } else {
        profiles.forEach(profile => {
            const linkCount = profile.links ? profile.links.length : 0;
            const hasUser = profile.id.startsWith('user_');
            const profileType = hasUser ? 
                '<span class="badge badge-position">Has User Account</span>' : 
                '<span class="badge badge-warning">Demo Profile (No User)</span>';
            
            html += `
                <div class="admin-profile-card" data-title="${(profile.title || '').toLowerCase()}" data-id="${profile.id.toLowerCase()}">
                    <div class="profile-info">
                        <img src="${profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + profile.id}" 
                             alt="${profile.title}" class="user-avatar-small">
                        <div class="profile-details">
                            <div class="profile-name">${profile.title || 'Untitled'}</div>
                            <div class="profile-id">ID: ${profile.id}</div>
                            <div class="profile-meta">
                                ${profileType}
                                <span class="badge badge-free">${linkCount} links</span>
                            </div>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="btn btn-small btn-secondary" onclick="viewProfilePage('${profile.id}')">View</button>
                        <button class="btn btn-small btn-danger" onclick="deleteProfile('${profile.id}', '${profile.title}')">Delete</button>
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    document.getElementById('admin-profiles-list').innerHTML = html;
}

function filterAdminProfiles() {
    const searchTerm = document.getElementById('admin-profile-search').value.toLowerCase();
    const profileCards = document.querySelectorAll('.admin-profile-card');
    
    profileCards.forEach(card => {
        const title = card.getAttribute('data-title');
        const id = card.getAttribute('data-id');
        
        if (title.includes(searchTerm) || id.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function viewProfilePage(profileId) {
    window.open(`/${profileId}`, '_blank');
}

async function deleteProfile(profileId, profileTitle) {
    const token = localStorage.getItem('token');
    
    if (!confirm(`Are you sure you want to delete profile "${profileTitle}"?\n\nThis will delete:\n- The profile\n- All links in the profile\n- Analytics data\n\nThis action cannot be undone.`)) return;
    
    try {
        const response = await fetch(`/api/profiles/${profileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            alert('Profile deleted successfully!');
            
            // Reload admin panel
            loadAdminPanel();
            
            // Clear cached profiles and reload browse profiles if that tab is active
            allProfiles = [];
            const browseTab = document.getElementById('browse-tab');
            if (browseTab && browseTab.classList.contains('active')) {
                loadBrowseProfiles();
            }
        } else {
            const error = await response.json();
            alert('Error: ' + error.detail);
        }
    } catch (error) {
        alert('Error deleting profile: ' + error.message);
    }
}
