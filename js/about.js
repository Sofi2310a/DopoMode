document.addEventListener('click', (e) => {
    const loginBtn = e.target.closest('#loginTrigger');
    const signinBtn = e.target.closest('#signinTrigger');

    if (loginBtn || signinBtn) {
        e.preventDefault(); 

        const authButtons = document.getElementById('authButtons');
        if (authButtons) authButtons.style.display = 'none';

        const userProfile = document.getElementById('userProfile');
        if (userProfile) userProfile.style.display = 'flex';

    }
});