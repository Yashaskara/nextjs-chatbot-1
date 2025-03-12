// pages/index.js
import Head from 'next/head';
import DocChatbot from '../components/DocChatbot';

export default function Home() {
    return (
        <div>
            <Head>
                <title>Documentation Chatbot</title>
            </Head>
            <main>
                <h1>Welcome to the Documentation Chatbot</h1>
                <DocChatbot />
            </main>
        </div>
    );
}