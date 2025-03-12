var esriConfig = {
    apiKey: 'AAPTxy8BH1VEsoebNVZXo8HurKurefuWTAdSBSqJhBB8uMLNL_GbD8SEr-18UkUPVvanELSFNe1U3Ivs9YbfXqaUGLGWCXAJn4ojeftlBPZ8OIXNtCeUI0x9jDPUbH85OyImszxS3BtIxnJI2x__MDvYn6Xzjeyh0wKfJICYaw5kGP7m4i0VH2PjA9YKoo-oLa2qy9yPaGvus3zHDEBsOyY1dZqVHUX3PrB8ylQuGwpJXNQ.AT1_H5e7fcm8'
};
const fetchLoginToken = async () => { 
    try {
        const response = await fetch('/api/genToken')
        const data = await response.json()
        if(data.token) {
            window.loginToken = data.token
            esriConfig.apiKey = data.token
        }else {
            console.error(data.error)
        }
    } catch (error) {
        console.error(error)
    } 
}
fetchLoginToken()