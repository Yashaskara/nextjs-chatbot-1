// pages/index.js
import Head from 'next/head';
import DocChatbot from '../components/DocChatbot';

export default function Home() {
    return (
        <div>
            <Head>
                <title>Unbxd DocBot</title>
                <link rel="icon" href="https://images.g2crowd.com/uploads/product/image/large_detail/large_detail_4d46814b876ce7a4ff30815d8c5e836e/netcore-customer-engagement-and-experience-platform.png" />
            </Head>
            <main>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                        src="https://images.g2crowd.com/uploads/product/image/large_detail/large_detail_4d46814b876ce7a4ff30815d8c5e836e/netcore-customer-engagement-and-experience-platform.png"
                        alt="Unbxd Logo"
                        style={{ width: '40px', height: 'auto' }}
                    />
                    <h1>Unbxd DocBot</h1>
                </div>
                <DocChatbot />
            </main>
        </div>
    );
}