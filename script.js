// Configuration
const config = {
    imagePath: 'images/',
    jsonFile: 'gallery-data.json'
};

let currentlyFlippedCard = null;

// Load and display images when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadGalleryData();
    
    // Click outside to close flipped cards
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.flip-card')) {
            closeAllCards();
        }
    });
    
    // Setup demo image zoom
    setupDemoImageZoom();
});

// Setup click-to-zoom for demo image
function setupDemoImageZoom() {
    const demoWrapper = document.getElementById('demoImageWrapper');
    const modal = document.getElementById('zoomModal');
    const modalImg = document.getElementById('zoomedImage');
    const closeBtn = document.querySelector('.close-modal');
    const demoImage = document.getElementById('demoImage');
    
    if (demoWrapper) {
        demoWrapper.addEventListener('click', () => {
            modal.style.display = 'block';
            modalImg.src = demoImage.src;
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// Close all flipped cards
function closeAllCards() {
    if (currentlyFlippedCard) {
        currentlyFlippedCard.classList.remove('flipped');
        currentlyFlippedCard = null;
    }
}

// Load gallery data
async function loadGalleryData() {
    try {
        const gridContainer = document.getElementById('imageGrid');
        const response = await fetch(config.jsonFile);
        
        if (!response.ok) {
            throw new Error(`Failed to load JSON file: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.images || !Array.isArray(data.images)) {
            throw new Error('Invalid JSON structure. Expected "images" array.');
        }
        
        gridContainer.innerHTML = '';
        renderGallery(data.images);
        
    } catch (error) {
        console.error('Error loading gallery:', error);
        showError(`Failed to load gallery: ${error.message}`);
    }
}

// Render gallery
function renderGallery(images) {
    const gridContainer = document.getElementById('imageGrid');
    
    images.forEach(image => {
        const flipCard = createFlipCard(image);
        gridContainer.appendChild(flipCard);
    });
    
    if (images.length === 0) {
        gridContainer.innerHTML = '<div class="loading">No images found. Add some to gallery-data.json!</div>';
    }
}

// Create fallback image data URL (inline SVG)
function getFallbackImage(title) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="#F8F9FA"/>
        <text x="200" y="180" font-family="Arial, sans-serif" font-size="20" fill="#5F6368" text-anchor="middle">📷 Image Not Found</text>
        <text x="200" y="230" font-family="Arial, sans-serif" font-size="14" fill="#9AA0A6" text-anchor="middle">${title || 'Missing Image'}</text>
        <text x="200" y="270" font-family="Arial, sans-serif" font-size="12" fill="#DADCE0" text-anchor="middle">Add image to /images/ folder</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Create flip card
function createFlipCard(imageData) {
    const card = document.createElement('div');
    card.className = 'flip-card';
    card.setAttribute('data-id', imageData.id);
    
    const inner = document.createElement('div');
    inner.className = 'flip-inner';
    
    const front = document.createElement('div');
    front.className = 'flip-front';
    
    const img = document.createElement('img');
    img.src = `${config.imagePath}${imageData.imageName}`;
    img.alt = imageData.title || 'Gallery image';
    img.loading = 'lazy';
    
    // Handle image loading errors - use fallback without causing infinite loop
    let errorHandled = false;
    img.onerror = () => {
        if (!errorHandled) {
            errorHandled = true;
            // Use inline SVG fallback instead of external URL
            img.src = getFallbackImage(imageData.title);
        }
    };
    
    front.appendChild(img);
    
    const back = document.createElement('div');
    back.className = 'flip-back';
    
    const title = document.createElement('h3');
    title.textContent = imageData.title || 'Untitled';
    
    const description = document.createElement('p');
    description.textContent = imageData.description || 'No description available';
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyBtn.title = 'Copy to clipboard';
    
    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCopy(imageData, copyBtn);
    });
    
    back.appendChild(title);
    back.appendChild(description);
    back.appendChild(copyBtn);
    
    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    
    card.addEventListener('click', (e) => {
        if (e.target === copyBtn || copyBtn.contains(e.target)) {
            return;
        }
        
        if (card.classList.contains('flipped')) {
            card.classList.remove('flipped');
            if (currentlyFlippedCard === card) {
                currentlyFlippedCard = null;
            }
        } else {
            if (currentlyFlippedCard && currentlyFlippedCard !== card) {
                currentlyFlippedCard.classList.remove('flipped');
            }
            card.classList.add('flipped');
            currentlyFlippedCard = card;
        }
    });
    
    return card;
}

// Handle copy
async function handleCopy(imageData, buttonElement) {
    const textToCopy = imageData.copyText;
    
    try {
        await navigator.clipboard.writeText(textToCopy);
        const originalIcon = buttonElement.innerHTML;
        buttonElement.classList.add('copied');
        
        setTimeout(() => {
            buttonElement.innerHTML = originalIcon;
            buttonElement.classList.remove('copied');
        }, 1500);
    } catch (err) {
        console.error('Failed to copy:', err);
        const originalIcon = buttonElement.innerHTML;
        
        setTimeout(() => {
            buttonElement.innerHTML = originalIcon;
        }, 1500);
    }
}

// Toast notification
function showGoogleToast(message, type = 'success') {
    const existingToast = document.querySelector('.google-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'google-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${type === 'success' ? '✓' : '⚠️'}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #323232;
        color: white;
        padding: 10px 24px;
        border-radius: 24px;
        font-size: 0.875rem;
        font-weight: 500;
        z-index: 10000;
        animation: toastSlideUp 0.3s ease;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        font-family: 'Google Sans', sans-serif;
        backdrop-filter: blur(8px);
        background: rgba(50, 50, 50, 0.95);
        pointer-events: none;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideDown 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) document.body.removeChild(toast);
        }, 300);
    }, 2000);
}

// Add toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes toastSlideDown {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
    }
`;
document.head.appendChild(style);

function showError(message) {
    const gridContainer = document.getElementById('imageGrid');
    if (gridContainer) {
        gridContainer.innerHTML = `<div class="error">⚠️ ${message}</div>`;
    }
}