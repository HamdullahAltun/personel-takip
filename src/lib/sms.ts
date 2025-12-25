export async function sendSMS(phone: string, message: string) {
    console.log('=============================================');
    console.log(`[MOCK SMS] To: ${phone}`);
    console.log(`[MOCK SMS] Message: ${message}`);
    console.log('=============================================');
    return true;
}
