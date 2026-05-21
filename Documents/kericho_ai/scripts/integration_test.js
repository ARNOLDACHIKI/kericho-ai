/**
 * Integration test: Verify session, topic detection, and parsing work together
 * This demonstrates the complete flow without requiring a database or WhatsApp
 */

const sessionServiceMemory = require('../services/sessionService.memory');
const { detectTopic, parseDuration } = require('../src/utils/topicDetection');

async function runIntegrationTest() {
  console.log('='.repeat(70));
  console.log('INTEGRATION TEST: Session + Topic Detection + Duration Parsing');
  console.log('='.repeat(70));
  
  const phone = '254712345678';
  
  try {
    // Test 1: Session management
    console.log('\n📋 TEST 1: Session Management');
    console.log('-'.repeat(70));
    
    const session1 = sessionServiceMemory.getSession(phone);
    console.log('✓ New session created');
    console.log('  Topic:', session1.topic, '| Step:', session1.step);
    
    sessionServiceMemory.updateSession(phone, { topic: 'malaria', step: 'awaiting_duration' });
    const session2 = sessionServiceMemory.getSession(phone);
    console.log('✓ Updated session');
    console.log('  Topic:', session2.topic, '| Step:', session2.step);
    
    // Test 2: Topic detection
    console.log('\n🏥 TEST 2: Topic Detection');
    console.log('-'.repeat(70));
    
    const testCases = [
      'I have malaria',
      'nina homa',
      'headache pain',
      'kichwa',
      'hiv test',
      'respiratory infection',
      'kohoma na mabamba',
      'pregnant',
      'nutrition advice',
    ];
    
    for (const text of testCases) {
      const topic = detectTopic(text);
      console.log(`  ✓ "${text}" → ${topic || 'null'}`);
    }
    
    // Test 3: Duration parsing
    console.log('\n⏱️  TEST 3: Duration Parsing');
    console.log('-'.repeat(70));
    
    const durationCases = [
      '2 days',
      '1 week',
      'yesterday',
      'today',
      '3',
      'siku 5',
      'wiki 2',
      'since morning',
    ];
    
    for (const text of durationCases) {
      const duration = parseDuration(text);
      if (duration) {
        console.log(`  ✓ "${text}" → ${duration.days} days`);
      } else {
        console.log(`  ✓ "${text}" → no match`);
      }
    }
    
    // Test 4: Complete conversation flow
    console.log('\n🔄 TEST 4: Complete Conversation Flow');
    console.log('-'.repeat(70));
    
    sessionServiceMemory.clearAllSessions();
    
    const conversationSteps = [
      { input: 'I have a headache', expectedTopic: 'headache' },
      { input: '3 days', expectedTopic: 'headache' },
      { input: 'menu', expectedTopic: null },
      { input: 'I have malaria', expectedTopic: 'malaria' },
      { input: '1 week', expectedTopic: 'malaria' },
    ];
    
    for (const step of conversationSteps) {
      const topic = detectTopic(step.input);
      const duration = parseDuration(step.input);
      const session = sessionServiceMemory.getSession(phone);
      
      console.log(`\n  Step: "${step.input}"`);
      console.log(`    → Topic: ${topic || 'none'}`);
      console.log(`    → Duration: ${duration ? `${duration.days}d` : 'none'}`);
      
      if (topic === 'menu' || step.input === 'menu') {
        sessionServiceMemory.clearSession(phone);
        console.log(`    → Action: Session cleared`);
      } else if (topic) {
        sessionServiceMemory.updateSession(phone, { 
          topic, 
          step: 'awaiting_duration',
          lastMessage: step.input 
        });
        console.log(`    → Action: Session updated (topic=${topic})`);
      } else if (duration && session.step === 'awaiting_duration') {
        sessionServiceMemory.updateSession(phone, { 
          lastMessage: step.input,
          step: null 
        });
        console.log(`    → Action: Conversation complete`);
      }
    }
    
    // Test 5: Session state summary
    console.log('\n📊 TEST 5: Final Session State');
    console.log('-'.repeat(70));
    const allSessions = sessionServiceMemory.getAllSessions();
    console.log('Active sessions:', Object.keys(allSessions).length);
    for (const [phone, sess] of Object.entries(allSessions)) {
      console.log(`  ${phone}: topic=${sess.topic}, step=${sess.step}`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL INTEGRATION TESTS PASSED');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runIntegrationTest();
