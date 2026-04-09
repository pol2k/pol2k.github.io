document.addEventListener('DOMContentLoaded', function() {
    fetch('course_config.json?v=' + new Date().getTime())
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(config => {
            try {
                applyConfig(config);
            } catch (e) {
                console.error('Error applying config:', e);
                const container = document.getElementById('dynamic-calendar-container');
                if (container) {
                    container.innerHTML = `
                        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                            <i class="fas fa-bug" style="font-size: 2rem; margin-bottom: 1rem; color: #f59e0b;"></i>
                            <p>Erreur de traitement de la configuration.</p>
                            <pre style="font-size: 0.8rem; margin-top: 0.5rem; white-space: pre-wrap; color: #ef4444;">${e.message}</pre>
                        </div>
                    `;
                }
            }
        })
        .catch(error => {
            console.error('Error loading course config:', error);
            const container = document.getElementById('dynamic-calendar-container');
            if (container) {
                container.innerHTML = `
                    <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; color: #f59e0b;"></i>
                        <p>Impossible de charger la configuration.</p>
                        <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                            Si vous testez en local (file://), les navigateurs bloquent souvent les fichiers JSON externes.<br>
                            Utilisez un serveur local (ex: <code>python3 -m http.server</code>) ou visualisez via GitHub Pages.
                        </p>
                        <pre style="font-size: 0.7rem; margin-top: 1rem; opacity: 0.7;">${error.message}</pre>
                    </div>
                `;
            }
        });
});

function applyConfig(config) {
    // Handle slide links for the static Diapositives grid
    if (config.slide_links) {
        for (const [id, url] of Object.entries(config.slide_links)) {
            if (id === '_comment') continue;

            const element = document.getElementById(`slide-${id}`);
            const link = element ? element.querySelector('a') : null;

            if (link && url) {
                link.href = url;
            }
        }
    }

    // Handle Slides
    if (config.slides) {
        for (const [id, isAvailable] of Object.entries(config.slides)) {
            const element = document.getElementById(`slide-${id}`);
            if (element) {
                if (!isAvailable) {
                    element.classList.add('disabled-item');
                    // Optional: Disable link
                    const link = element.querySelector('a');
                    if (link) {
                        link.removeAttribute('href');
                        link.style.pointerEvents = 'none';
                    }
                }
            }
        }
    }

    // Handle Exercises
    if (config.exercises) {
        for (const [id, isAvailable] of Object.entries(config.exercises)) {
            const element = document.getElementById(`ex-${id}`);
            if (element) {
                if (!isAvailable) {
                    element.classList.add('disabled-item');
                    // Disable link
                    element.removeAttribute('href');
                    element.style.pointerEvents = 'none';
                }
            }
        }
    }

    // Handle Evaluations
    if (config.evaluations) {
        for (const [id, value] of Object.entries(config.evaluations)) {
            if (id === '_comment') continue; // Skip comment key

            const element = document.getElementById(`eval-${id}`);
            if (element) {
                const tag = element.querySelector('.timeline-tag');
                
                // Determine status and url
                let status = value;
                let url = null;
                
                if (typeof value === 'object' && value !== null) {
                    status = value.status;
                    url = value.url;
                }

                // Reset classes
                element.classList.remove('completed', 'pending', 'active');
                if (tag) tag.className = 'timeline-tag'; // Reset tag classes
                
                if (status === 'pending') {
                    element.classList.add('pending');
                    element.style.opacity = '0.8'; 
                    if (tag) {
                        tag.textContent = 'À venir';
                        tag.classList.add('status-pending');
                    }
                } else if (status === 'completed') {
                    element.classList.add('completed');
                    element.style.opacity = '0.8';
                    if (tag) {
                        tag.textContent = 'Terminé';
                        tag.classList.add('status-completed');
                    }
                } else if (status === 'active') {
                    element.classList.add('active');
                    element.style.opacity = '1';
                    if (tag) {
                        tag.textContent = 'En cours';
                        tag.classList.add('status-active');
                    }
                }

                // Handle Link Button
                const content = element.querySelector('.timeline-content');
                let linkBtn = element.querySelector('.eval-link');

                if (url && content && status === 'active') {
                    if (!linkBtn) {
                        linkBtn = document.createElement('a');
                        linkBtn.className = 'btn btn-primary eval-link';
                        linkBtn.target = '_blank';
                        linkBtn.innerHTML = '<i class="fab fa-github"></i> Accéder'; // Add icon
                        linkBtn.style.marginTop = '1rem';
                        linkBtn.style.width = '100%'; // Full width on mobile looks good, or auto
                        linkBtn.style.justifyContent = 'center';
                        content.appendChild(linkBtn);
                    }
                    linkBtn.href = url;
                    linkBtn.style.display = 'inline-flex';
                } else if (linkBtn) {
                    // Remove button if no url provided, or if status is not active
                    linkBtn.remove();
                }
            }
        }
    }

    // Handle Rencontres
    if (config.rencontres) {
        const iframeContainer = document.getElementById('rencontres-iframe-container');
        const placeholderContainer = document.getElementById('rencontres-placeholder');
        const iframe = document.getElementById('rencontres-iframe');

        if (config.rencontres.link) {
            // Show iframe, hide placeholder
            if (iframeContainer) iframeContainer.style.display = 'block';
            if (placeholderContainer) placeholderContainer.style.display = 'none';
            if (iframe) iframe.src = config.rencontres.link;
        } else {
            // Show placeholder, hide iframe
            if (iframeContainer) iframeContainer.style.display = 'none';
            if (placeholderContainer) placeholderContainer.style.display = 'flex'; // Use flex for centering
        }
    }

    // Handle Schedule (Dynamic Calendar)
    if (config.schedule) {
        renderCalendar(config.schedule, config);
    }
}

function renderCalendar(schedule, config) {
    const container = document.getElementById('dynamic-calendar-container');
    if (!container) return;

    container.innerHTML = ''; // Clear loading text
    
    // Create wrapper for the roadmap style
    const roadmap = document.createElement('div');
    roadmap.className = 'roadmap-container';
    container.appendChild(roadmap);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort schedule by date
    schedule.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Find current week index
    let currentIndex = -1;
    for (let i = 0; i < schedule.length; i++) {
        const itemDate = new Date(schedule[i].date);
        if (today >= itemDate) {
            currentIndex = i;
        }
    }

    schedule.forEach((item, index) => {
        // Fix date parsing to avoid timezone issues (YYYY-MM-DD -> Local Date)
        const [year, month, day] = item.date.split('-').map(Number);
        const itemDate = new Date(year, month - 1, day);
        
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex;
        
        // Format date: "7 Janv"
        const dateStr = itemDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

        const card = document.createElement('div');
        card.className = `roadmap-item ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''} ${item.type === 'break' ? 'is-break' : ''} ${item.type === 'important-eval' ? 'is-important' : ''}`;
        
        // HTML Structure
        let tagsHtml = '';
        if (item.tags) {
            tagsHtml = `<div class="roadmap-tags">` + 
                item.tags.map(t => `<span class="roadmap-tag tag-${t.type}">${t.text}</span>`).join('') + 
                `</div>`;
        }

        // Slide Thumbnail
        let slideHtml = '';
        if (item.slide) {
            // Determine availability
            let isAvailable = true;
            if (config && config.slides) {
                let slideId = null;
                if (item.slide.image) {
                    const match = item.slide.image.match(/images\/(.*)\.png/);
                    if (match) slideId = match[1];
                } else if (item.slide.url && item.slide.url.includes('resume')) {
                    slideId = 'resume';
                }

                if (slideId && config.slides[slideId] === false) {
                    isAvailable = false;
                }
            }

            const disabledClass = !isAvailable ? 'disabled-item' : '';
            const hrefAttr = isAvailable ? `href="${item.slide.url}"` : '';
            const pointerStyle = !isAvailable ? 'style="pointer-events: none; opacity: 0.5; filter: grayscale(100%);"' : '';

            if (item.slide.image) {
                slideHtml = `
                <a ${hrefAttr} target="_blank" class="roadmap-slide-thumb ${disabledClass}" ${pointerStyle} title="Voir les diapositives">
                    <img src="${item.slide.image}" alt="Diapositives" loading="lazy">
                    <div class="slide-overlay"><i class="fas fa-external-link-alt"></i></div>
                </a>`;
            } else if (item.slide.icon) {
                 slideHtml = `
                <a ${hrefAttr} target="_blank" class="roadmap-slide-thumb is-icon ${disabledClass}" ${pointerStyle} title="Voir les diapositives">
                    <i class="${item.slide.icon}"></i>
                </a>`;
            }
        }

        // Anchor Button
        let anchorHtml = '';
        if (item.anchor) {
            anchorHtml = `
            <a href="#${item.anchor}" class="roadmap-action-btn" title="Voir les détails">
                <i class="fas fa-arrow-right"></i>
            </a>`;
        }

        card.innerHTML = `
            <div class="roadmap-marker"></div>
            <div class="roadmap-content-wrapper">
                <div class="roadmap-card">
                    <div class="roadmap-header">
                        <span class="roadmap-week">${typeof item.week === 'number' ? 'Semaine ' + item.week : item.week}</span>
                        <span class="roadmap-date">${dateStr}</span>
                    </div>
                    <div class="roadmap-body">
                        <div class="roadmap-info">
                            <h4>${item.title}</h4>
                            <p>${item.description}</p>
                            ${tagsHtml}
                        </div>
                        <div class="roadmap-actions">
                            ${slideHtml}
                            ${anchorHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;

        roadmap.appendChild(card);
    });
}
