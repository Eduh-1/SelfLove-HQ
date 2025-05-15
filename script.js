const heartsContainer = document.querySelector('.hearts');
const heartCount = 100;
const colors = ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍'];

function createHeart() {
    const heart = document.createElement('div');
    heart.classList.add('heart');
    
    // Select a random color from the array
    const randomColorIndex = Math.floor(Math.random() * colors.length);
    heart.innerHTML = colors[randomColorIndex];
    
    // Positioning and animation
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.bottom = '-20px';
    heart.style.animationDuration = Math.random() * 5 + 3 + 's';
    
    // Random sizing
    const heartSize = Math.random() * 30 + 20;
    heart.style.fontSize = heartSize + 'px';
    
    // Other styling
    heart.style.zIndex = Math.floor(Math.random() * 3);
    heart.style.transform = `rotate(${Math.random() * 360}deg)`;
    heart.style.opacity = Math.random() * 0.5 + 0.3;
    heart.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
    heart.style.position = 'absolute';
    
    heartsContainer.appendChild(heart);
    
    // Remove heart after animation
    setTimeout(() => {
        heart.remove();
    }, 60000); // Reduced from 100000 to 10000 (10 seconds)
}

// Create multiple hearts
for (let i = 0; i < heartCount; i++) {
    setTimeout(createHeart, i * 300); // Stagger creation
}
createHeart()
 


setInterval(() => {
createHeart(heartsCointainer);
}, 300);

const messages =[
    "You are enough, just as you are. 🌟",
    "Believe in yourself and all that you are. 💪",
    "You are capable of amazing things. 🚀",
    "The world is a better place with you in it. 💖",
    "Your smile can change the world. 😊",
    "You are stronger than you think. 💪",
    "You are loved more than you know. ❤️",
    "You are unique and special. 🌈",
    "You have the power to make a difference. 🌍",
    "You are worthy of love and happiness. 💕",
    "You are doing better than you think. 🌟",
    "You are a work of art. 🎨",
    "You are a beautiful person inside and out. 🌼",
]
const dynamicMessage = document.getElementById('dynamic-message');
const changeMessageButton = document.getElementById('change-message-button');

function generatemessage() {
    const randomIndex = Math.floor(Math.random() * messages.length);
    dynamicMessage.textContent = messages[randomIndex];
    
}
generatemessage();
changeMessageButton.addEventListener('click', generatemessage);
setInterval(generatemessage, 10000);
