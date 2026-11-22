// ============================================
// WEDDING INVITATION - MAIN JAVASCRIPT
// ============================================

// Configuration - Update these values
const CONFIG = {
    weddingDate: '2026-12-20T10:00:00+07:00', // Wedding date and time
    coupleNames: {
        groom: 'Quốc Phong',
        bride: 'Phương Anh'
    },
    // Google Maps links for events
    maps: {
        ceremony: 'https://www.google.com/maps/search/?api=1&query=',
        reception: 'https://www.google.com/maps/search/?api=1&query='
    }
};

// ============================================
// PRELOADER
// ============================================
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('preloader').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('preloader').style.display = 'none';
        }, 500);
    }, 1000);
});

// ============================================
// OPEN INVITATION
// ============================================
function openInvitation() {
    const hero = document.getElementById('hero');
    const invitation = document.getElementById('invitation');

    // Start within the user's click gesture so browsers allow autoplay.
    playMusic();

    // Smooth scroll to invitation
    hero.style.transition = 'opacity 0.5s ease';
    hero.style.opacity = '0';

    setTimeout(() => {
        hero.style.display = 'none';
        invitation.classList.remove('hidden');
        invitation.scrollIntoView({ behavior: 'smooth' });

        // Re-check hidden elements immediately after the invitation becomes visible.
        document.querySelectorAll('.scroll-animation:not(.visible)').forEach(el => {
            if (typeof observer !== 'undefined') observer.observe(el);
        });
    }, 500);
}

// ============================================
// MUSIC CONTROL
// ============================================
let isMusicPlaying = false;

function updateMusicButton() {
    const musicBtn = document.getElementById('musicToggle');
    if (!musicBtn) return;

    musicBtn.classList.toggle('paused', !isMusicPlaying);
    musicBtn.setAttribute('aria-pressed', String(isMusicPlaying));
    musicBtn.setAttribute('aria-label', isMusicPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền');
}

function playMusic() {
    const music = document.getElementById('bgMusic');
    if (!music) return;

    music.play().then(() => {
        isMusicPlaying = true;
        updateMusicButton();
    }).catch(() => {
        isMusicPlaying = false;
        updateMusicButton();
    });
}

document.getElementById('musicToggle').addEventListener('click', () => {
    const music = document.getElementById('bgMusic');

    if (isMusicPlaying) {
        music.pause();
        isMusicPlaying = false;
    } else {
        playMusic();
        return;
    }

    updateMusicButton();
});

// ============================================
// COUNTDOWN TIMER
// ============================================
function updateCountdown() {
    const weddingDate = new Date(CONFIG.weddingDate).getTime();
    const now = new Date().getTime();
    const distance = weddingDate - now;

    if (distance < 0) {
        // Wedding day has passed
        document.getElementById('days').textContent = '0';
        document.getElementById('hours').textContent = '0';
        document.getElementById('minutes').textContent = '0';
        document.getElementById('seconds').textContent = '0';
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = days;
    document.getElementById('hours').textContent = hours;
    document.getElementById('minutes').textContent = minutes;
    document.getElementById('seconds').textContent = seconds;
}

// Update countdown every second
setInterval(updateCountdown, 1000);
updateCountdown();

// ============================================
// OPEN MAP
// ============================================
function openMap(location) {
    const encodedLocation = encodeURIComponent(location);
    const mapUrl = `${CONFIG.maps.ceremony}${encodedLocation}`;
    window.open(mapUrl, '_blank');
}

// ============================================
// RSVP FORM
// ============================================
function submitRSVP(event) {
    event.preventDefault();
    
    const form = document.getElementById('rsvpForm');
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const attendance = document.getElementById('attendance').value;
    const guests = document.getElementById('guests').value;
    const message = document.getElementById('message').value.trim();

    // Validate form
    if (!name || !phone || !attendance) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
    }

    // Create RSVP data object
    const rsvpData = {
        name: name,
        phone: phone,
        attendance: attendance,
        guests: guests,
        message: message,
        timestamp: new Date().toISOString()
    };

    // Save locally and immediately refresh the guest wishes below the form.
    saveRSVP(rsvpData);
    renderRSVPs();
    form.reset();

    // Keep the form available for other guests and show brief confirmation.
    const successMessage = document.getElementById('rsvpSuccess');
    successMessage.classList.remove('hidden');
    window.clearTimeout(window.rsvpSuccessTimeout);
    window.rsvpSuccessTimeout = window.setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 4000);

    // Optional: Send to backend/email service
    // sendRSVPToServer(rsvpData);
}

// Save RSVP to localStorage
function saveRSVP(data) {
    const rsvps = getStoredRSVPs();
    rsvps.push(data);

    try {
        localStorage.setItem('weddingRSVPs', JSON.stringify(rsvps));
    } catch (error) {
        console.error('Unable to save RSVP:', error);
    }
}

function getStoredRSVPs() {
    try {
        const savedRSVPs = JSON.parse(localStorage.getItem('weddingRSVPs') || '[]');
        return Array.isArray(savedRSVPs) ? savedRSVPs : [];
    } catch (error) {
        console.warn('Unable to read saved RSVPs:', error);
        return [];
    }
}

function renderRSVPs() {
    const wishList = document.getElementById('wishList');
    if (!wishList) return;

    const wishes = getStoredRSVPs()
        .filter((rsvp) => rsvp && typeof rsvp.message === 'string' && rsvp.message.trim())
        .reverse();

    wishList.replaceChildren();

    if (wishes.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'wish-empty';
        emptyMessage.textContent = 'Lời chúc của khách mời sẽ hiển thị tại đây.';
        wishList.appendChild(emptyMessage);
        return;
    }

    wishes.forEach((rsvp) => {
        const card = document.createElement('article');
        card.className = 'wish-card';

        const author = document.createElement('strong');
        author.className = 'wish-author';
        author.textContent = typeof rsvp.name === 'string' && rsvp.name.trim()
            ? rsvp.name.trim()
            : 'Khách mời';

        const message = document.createElement('p');
        message.className = 'wish-message';
        message.textContent = rsvp.message.trim();

        card.append(author, message);
        wishList.appendChild(card);
    });
}

// Optional: Send RSVP to server (uncomment and configure)
/*
async function sendRSVPToServer(data) {
    try {
        const response = await fetch('YOUR_BACKEND_URL/api/rsvp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        console.log('RSVP sent to server successfully');
    } catch (error) {
        console.error('Error sending RSVP:', error);
    }
}
*/

// ============================================
// GALLERY SLIDER
// ============================================
const galleryMainImage = document.getElementById('galleryMainImage');
const galleryThumbnails = [...document.querySelectorAll('.gallery-thumbnail')];
let galleryIndex = 0;

function showGalleryImage(index) {
    if (!galleryMainImage || galleryThumbnails.length === 0) return;

    galleryIndex = (index + galleryThumbnails.length) % galleryThumbnails.length;
    const thumbnail = galleryThumbnails[galleryIndex];
    const image = thumbnail.querySelector('img');

    galleryMainImage.style.opacity = '0';
    galleryMainImage.style.transform = 'scale(0.985)';

    window.setTimeout(() => {
        galleryMainImage.src = image.src;
        galleryMainImage.alt = `Khoảnh khắc cưới ${galleryIndex + 1}`;
        galleryMainImage.style.opacity = '1';
        galleryMainImage.style.transform = 'scale(1)';
    }, 150);

    galleryThumbnails.forEach((item, itemIndex) => {
        item.classList.toggle('active', itemIndex === galleryIndex);
    });

    thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

document.querySelector('.gallery-arrow-prev')?.addEventListener('click', () => showGalleryImage(galleryIndex - 1));
document.querySelector('.gallery-arrow-next')?.addEventListener('click', () => showGalleryImage(galleryIndex + 1));

galleryThumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener('click', () => showGalleryImage(index));
});

let galleryTouchStart = 0;
document.getElementById('gallerySlider')?.addEventListener('touchstart', event => {
    galleryTouchStart = event.changedTouches[0].screenX;
}, { passive: true });

document.getElementById('gallerySlider')?.addEventListener('touchend', event => {
    const distance = event.changedTouches[0].screenX - galleryTouchStart;
    if (Math.abs(distance) > 45) {
        showGalleryImage(galleryIndex + (distance < 0 ? 1 : -1));
    }
}, { passive: true });

// ============================================
// LIGHTBOX
// ============================================
function closeLightbox() {
    document.getElementById('lightbox').classList.add('hidden');
}

// Close lightbox on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// Close lightbox on click outside
document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target === document.getElementById('lightbox')) {
        closeLightbox();
    }
});

// ============================================
// SCROLL ANIMATIONS
// ============================================
const revealSelector = [
    '.invite-kicker',
    '.invite-recipient',
    '.invite-intro',
    '.invite-couple-names',
    '.invite-date-block',
    '.invite-lunar-date',
    '.invite-venue',
    '.invite-message',
    '.section-title',
    '.couple-photo-shared',
    '.family-card',
    '.couple-card',
    '.event-card',
    '.calendar-container',
    '.countdown-item',
    '.gallery-item',
    '.rsvp-note',
    '.rsvp-form',
    '.footer'
].join(', ');

const revealGroups = [
    '.family-card',
    '.couple-card',
    '.event-card',
    '.countdown-item',
    '.gallery-item'
];

document.querySelectorAll(revealSelector).forEach(el => el.classList.add('scroll-animation'));

revealGroups.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, index) => {
        el.style.setProperty('--reveal-delay', `${Math.min(index * 90, 360)}ms`);
    });
});

const observer = new IntersectionObserver((entries, revealObserver) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px'
});

document.querySelectorAll('.scroll-animation').forEach(el => observer.observe(el));

// ============================================
// FLOATING HEARTS EFFECT
// ============================================
function createFloatingHeart() {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.innerHTML = '❤';
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.animationDuration = (Math.random() * 3 + 2) + 's';
    heart.style.fontSize = (Math.random() * 20 + 10) + 'px';
    heart.style.opacity = Math.random() * 0.5 + 0.3;
    
    document.body.appendChild(heart);
    
    setTimeout(() => {
        heart.remove();
    }, 5000);
}

// Create floating hearts periodically
setInterval(createFloatingHeart, 2000);

// ============================================
// SHARE FUNCTIONALITY
// ============================================
function shareInvitation() {
    const shareData = {
        title: `Thiệp Mời Đám Cưới - ${CONFIG.coupleNames.groom} & ${CONFIG.coupleNames.bride}`,
        text: `Trân trọng kính mời bạn đến dự đám cưới của ${CONFIG.coupleNames.groom} & ${CONFIG.coupleNames.bride}`,
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(console.error);
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Link đã được sao chép!');
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    renderRSVPs();

    // Add floating heart styles
    const style = document.createElement('style');
    style.textContent = `
        .floating-heart {
            position: fixed;
            bottom: -50px;
            color: #c9a86a;
            animation: floatUp linear forwards;
            z-index: 100;
            pointer-events: none;
        }
        
        @keyframes floatUp {
            from {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            to {
                transform: translateY(-100vh) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});