// Add animation for the "Explore" button hover effect
const btn = document.querySelector('.trending-btn');

btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.1)';
});

btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
});
