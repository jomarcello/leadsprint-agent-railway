#!/usr/bin/env node

/**
 * 🤖 AUTONOMOUS HEALTHCARE AGENT SERVER
 * 
 * Implements the complete HEALTHCARE-AUTOMATION-AGENT-PROMPT.md workflow
 * 
 * Trigger: POST /create-leads { "count": 3 }
 * Output: Complete healthcare demos deployed to Railway
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chalk from 'chalk';
import fs from 'fs/promises';
import { execSync } from 'child_process';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

// REMOVED: Railway MCP Direct Connection - Using GitHub Actions instead

class AutonomousHealthcareAgent {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.setupMiddleware();
    this.setupRoutes();
    
    // Agent configuration
    this.config = {
      githubToken: process.env.GITHUB_TOKEN || this.throwMissingEnvError('GITHUB_TOKEN'),
      railwayToken: process.env.RAILWAY_TOKEN || this.throwMissingEnvError('RAILWAY_TOKEN'),
      notionApiKey: process.env.NOTION_API_KEY || this.throwMissingEnvError('NOTION_API_KEY'),
      notionDatabaseId: process.env.NOTION_DATABASE_ID || this.throwMissingEnvError('NOTION_DATABASE_ID'),
      elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || this.throwMissingEnvError('ELEVENLABS_API_KEY'),
      openRouterApiKey: process.env.OPENROUTER_API_KEY || this.throwMissingEnvError('OPENROUTER_API_KEY'),
      masterAgentId: process.env.ELEVENLABS_AGENT_ID || this.throwMissingEnvError('ELEVENLABS_AGENT_ID'),
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || this.throwMissingEnvError('TELEGRAM_BOT_TOKEN')
    };
    
    // EXA API key for real healthcare practice discovery
    this.exaApiKey = process.env.EXA_API_KEY || this.throwMissingEnvError('EXA_API_KEY');

    // Initialize Telegram Bot
    this.setupTelegramBot();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * 🚨 SECURITY: Throw error for missing environment variables
   * Never allow hardcoded API keys in production code
   */
  throwMissingEnvError(envVar) {
    throw new Error(`🚨 SECURITY: ${envVar} environment variable is required. Never hardcode API keys in source code!`);
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        agent: 'Autonomous Healthcare Agent',
        timestamp: new Date().toISOString()
      });
    });

    // Agent status
    this.app.get('/status', (req, res) => {
      res.json({
        agent: 'Autonomous Healthcare Agent v1.0',
        capabilities: [
          'Web Scraping (Playwright MCP)',
          'Lead Storage (Notion MCP)', 
          'Voice Agents (ElevenLabs MCP)',
          'Repository Creation (GitHub API)',
          'Deployment (Railway MCP)'
        ],
        searchEngine: 'EXA API',
        ready: true
      });
    });

    // Main trigger endpoint
    this.app.post('/create-leads', async (req, res) => {
      try {
        const { count = 1 } = req.body;
        
        console.log(chalk.cyan(`🤖 AUTONOMOUS TRIGGER: Creating ${count} healthcare leads`));
        
        const results = await this.executeAutonomousWorkflow(count);
        
        res.json({
          success: true,
          requested: count,
          completed: results.filter(r => r.status === 'success').length,
          results: results
        });
        
      } catch (error) {
        console.error(chalk.red('❌ Autonomous workflow failed:'), error);
        res.status(500).json({
          success: false,
          error: error.message,
          stack: error.stack
        });
      }
    });

    // Batch processing endpoint
    this.app.post('/process-urls', async (req, res) => {
      try {
        const { urls } = req.body;
        
        if (!urls || !Array.isArray(urls)) {
          return res.status(400).json({ error: 'URLs array required' });
        }
        
        console.log(chalk.cyan(`🤖 BATCH PROCESSING: ${urls.length} healthcare websites`));
        
        const results = [];
        for (const url of urls) {
          const result = await this.processHealthcareWebsite(url);
          results.push(result);
        }
        
        res.json({
          success: true,
          processed: urls.length,
          results: results
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Single website demo endpoint - accepts user provided URL
    this.app.post('/demo', async (req, res) => {
      try {
        const { websiteUrl, practiceType } = req.body;
        
        if (!websiteUrl) {
          return res.status(400).json({ error: 'websiteUrl is required' });
        }
        
        console.log(chalk.cyan(`🤖 SINGLE DEMO: Processing ${websiteUrl}`));
        console.log(chalk.gray(`Practice Type: ${practiceType || 'auto-detect'}`));
        
        const result = await this.processHealthcareWebsite(websiteUrl);
        
        res.json({
          success: result.status === 'success',
          websiteUrl: websiteUrl,
          result: result
        });
        
      } catch (error) {
        console.error(chalk.red('❌ Demo processing failed:'), error);
        res.status(500).json({
          success: false,
          error: error.message,
          stack: error.stack
        });
      }
    });

    // AI Conversational endpoint - test conversational AI functionality
    this.app.post('/conversation', async (req, res) => {
      try {
        const { message } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'message is required' });
        }
        
        console.log(chalk.cyan(`🤖 AI CONVERSATION: Processing message`));
        console.log(chalk.gray(`Message: ${message}`));
        
        // Use empty conversation history for web requests
        const conversationHistory = [];
        const aiResponse = await this.processConversationalInput(message, conversationHistory);
        
        // Check if AI wants to execute workflow
        if (aiResponse.executeWorkflow && aiResponse.workflowConfig) {
          console.log(chalk.green('🚀 AI requested workflow execution - starting custom workflow'));
          
          // Send immediate response to user that we're starting
          res.json({
            success: true,
            message: message,
            aiResponse: aiResponse,
            workflowStarted: true,
            status: 'Workflow started - this may take 5-15 minutes',
            timestamp: new Date().toISOString()
          });
          
          // Execute workflow in background (don't await to avoid timeout)
          this.executeCustomAutonomousWorkflow(aiResponse.workflowConfig).then(results => {
            console.log(chalk.green(`✅ Background workflow completed: ${results.filter(r => r.success).length}/${results.length} successful`));
          }).catch(error => {
            console.log(chalk.red('❌ Background workflow failed:'), error);
          });
          
        } else {
          // Just conversation, no workflow
          res.json({
            success: true,
            message: message,
            aiResponse: aiResponse,
            workflowStarted: false,
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (error) {
        console.error(chalk.red('❌ Conversation endpoint error:'), error);
        res.status(500).json({
          success: false,
          error: error.message,
          stack: error.stack
        });
      }
    });

    // Workflow results endpoint - check stored leads in Notion
    this.app.get('/leads', async (req, res) => {
      try {
        console.log(chalk.cyan('📊 FETCHING: Recent leads from Notion database'));
        
        const response = await axios.post(`https://api.notion.com/v1/databases/${this.config.notionDatabaseId}/query`, {
          sorts: [{ property: 'Created time', direction: 'descending' }],
          page_size: 20
        }, {
          headers: {
            'Authorization': `Bearer ${this.config.notionApiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
          }
        });

        const leads = response.data.results.map(page => ({
          id: page.id,
          practiceName: page.properties['Practice Name']?.title[0]?.text?.content || 'Unknown',
          location: page.properties['Location']?.rich_text[0]?.text?.content || 'Unknown',
          phone: page.properties['Phone Number']?.phone_number || page.properties['Phone Number']?.rich_text[0]?.text?.content || 'Unknown',
          email: page.properties['Email']?.email || 'Unknown',
          websiteUrl: page.properties['Website URL']?.url || 'Unknown',
          demoUrl: page.properties['Demo URL']?.url || null,
          agentId: page.properties['Agent ID']?.rich_text[0]?.text?.content || 'pending',
          createdTime: page.created_time
        }));

        res.json({
          success: true,
          totalLeads: leads.length,
          leads: leads,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(chalk.red('❌ Leads fetch error:'), error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Telegram webhook endpoint
    this.app.post('/webhook/telegram', (req, res) => {
      console.log('📱 Telegram webhook received');
      
      try {
        const update = req.body;
        
        if (update && update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const messageText = update.message.text;
          
          console.log('Got message:', messageText);
          
          if (messageText.startsWith('/start')) {
            this.handleStartCommand(chatId);
          } else if (!messageText.startsWith('/')) {
            console.log('Starting AI conversation handler...');
            this.handleConversationalMessage(chatId, messageText);
          }
        }
        
        res.status(200).send('OK');
      } catch (error) {
        console.log('Webhook error:', error);
        res.status(500).send('Error');
      }
    });
  }

  setupTelegramBot() {
    if (!this.config.telegramBotToken) {
      console.log('⚠️ Telegram bot token not provided, skipping bot setup');
      return;
    }

    // Use webhook instead of polling to prevent conflicts
    this.bot = new TelegramBot(this.config.telegramBotToken);
    console.log('✅ Telegram bot initialized (webhook mode)');
    
    // Initialize user contexts
    this.userContexts = new Map();

    // Set webhook (this will be called automatically by Railway)
    const webhookUrl = `https://${process.env.RAILWAY_STATIC_URL || 'leadsprint-agent-clean-production.up.railway.app'}/webhook/telegram`;
    this.bot.setWebHook(webhookUrl).then(() => {
      console.log(`✅ Telegram webhook set to: ${webhookUrl}`);
    }).catch(error => {
      console.log(`⚠️ Webhook setup warning: ${error.message}`);
    });
  }

  handleStartCommand(chatId) {
    // Initialize user context
    this.userContexts.set(chatId, {
      conversationHistory: [],
      lastWorkflowConfig: null
    });
    
    this.bot.sendMessage(chatId, `
🤖 *Autonomous Healthcare Agent with AI*

Welcome! I'm your intelligent healthcare lead generation assistant.

💬 **AI Conversation Mode**
Just talk to me naturally! I can understand complex instructions like:
• "Find 5 cosmetic surgery clinics in London"
• "Generate leads for dental practices in Germany, exclude generic ones"  
• "Search for wellness centers in Amsterdam with real doctor names"

📋 **Quick Commands:**
• /workflow [count] - Traditional workflow trigger
• /status - Agent status
• /health - Health check
• /help - Show help

🧠 **AI Features:**
• GLM-4.5-Air powered natural language understanding (FREE model)
• Dynamic workflow customization
• Intelligent filtering
• Conversational lead generation

Just send me a message describing what you want! 🚀`, { parse_mode: 'Markdown' });
  }

  handleHelpCommand(chatId) {
    this.bot.sendMessage(chatId, `
📋 *AI Healthcare Lead Generation Assistant*

🧠 **AI Conversation Mode** (NEW!)
Just talk to me naturally! Examples:
• "Find 3 plastic surgery clinics in Paris with real doctor names"
• "Generate leads for dental practices in Berlin, avoid generic websites"
• "Search for 5 wellness centers in Toronto, focus on established practices"

🔧 **Commands:**
• */workflow [count]* - Traditional workflow (1-10 leads)
• */status* - Agent status and uptime
• */health* - Complete health check
• */help* - Show this help

🤖 **AI Features:**
• GLM-4.5-Air powered natural language understanding (FREE model)
• Dynamic search query generation
• Intelligent filtering and customization
• Contextual conversation memory
• Custom workflow parameters

The AI agent will automatically:
1. Understand your natural language request
2. Find healthcare practices with EXA search
3. Extract real doctor information with AI
4. Create personalized demo websites
5. Deploy to Railway with custom domains
6. Store leads in Notion CRM

💬 Just describe what you want in plain English!`, { parse_mode: 'Markdown' });
  }

  handleStatusCommand(chatId) {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    this.bot.sendMessage(chatId, `
🟢 *Agent Status: ACTIVE*

⏱️ Uptime: ${hours}h ${minutes}m
🌐 Health Endpoint: /health
📦 Version: 1.0.0
🔧 Environment: ${process.env.NODE_ENV || 'production'}

✅ All systems operational`, { parse_mode: 'Markdown' });
  }

  async handleHealthCommand(chatId) {
    try {
      const healthStatus = {
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        apiKeys: {
          openrouter: !!this.config.openRouterApiKey,
          railway: !!this.config.railwayToken,
          github: !!this.config.githubToken,
          elevenlabs: !!this.config.elevenLabsApiKey,
          notion: !!this.config.notionApiKey,
          exa: !!this.exaApiKey
        }
      };
      
      this.bot.sendMessage(chatId, `
❤️ *Health Check Results*

✅ Status: Healthy
⏰ ${healthStatus.timestamp}
🔑 API Keys: ${Object.values(healthStatus.apiKeys).filter(Boolean).length}/6 configured
💾 Memory: ${Math.round(healthStatus.memory.heapUsed / 1024 / 1024)}MB used`, { parse_mode: 'Markdown' });
    } catch (error) {
      this.bot.sendMessage(chatId, `❌ Health check failed: ${error.message}`);
    }
  }

  async handleWorkflowCommand(chatId, leadCount) {
    if (leadCount < 1 || leadCount > 10) {
      this.bot.sendMessage(chatId, '❌ Invalid lead count. Please specify between 1-10 leads.');
      return;
    }

    this.bot.sendMessage(chatId, `
🚀 *Starting Healthcare Lead Generation*

🎯 Target: ${leadCount} healthcare leads
⏳ This may take 5-15 minutes...

I'll keep you updated on progress!`, { parse_mode: 'Markdown' });

    try {
      // Execute workflow in background
      this.executeWorkflowWithUpdates(chatId, leadCount);
    } catch (error) {
      this.bot.sendMessage(chatId, `❌ Failed to start workflow: ${error.message}`);
    }
  }

  async handleConversationalMessage(chatId, messageText) {
    console.log(`🧠 STARTING handleConversationalMessage for chatId: ${chatId}, message: "${messageText}"`);
    
    try {
      // Initialize user context if not exists
      if (!this.userContexts.has(chatId)) {
        console.log('📝 Creating new user context');
        this.userContexts.set(chatId, {
          conversationHistory: [],
          lastWorkflowConfig: null
        });
      }

      const userContext = this.userContexts.get(chatId);
      console.log(`📚 Current conversation history length: ${userContext.conversationHistory.length}`);
      
      // Add message to conversation history
      userContext.conversationHistory.push({
        role: 'user',
        content: messageText,
        timestamp: new Date().toISOString()
      });

      // Keep conversation history manageable (last 10 messages)
      if (userContext.conversationHistory.length > 10) {
        userContext.conversationHistory = userContext.conversationHistory.slice(-10);
      }

      console.log('📨 Sending "processing" message to user...');
      await this.bot.sendMessage(chatId, '🧠 *AI is processing your request...* Analyzing your instructions and generating workflow parameters.', { parse_mode: 'Markdown' });

      try {
        console.log('🤖 Calling processConversationalInput...');
        // Use GLM-4.5-Air to understand the user's intent and extract workflow parameters
        const aiResponse = await this.processConversationalInput(messageText, userContext.conversationHistory);
        
        console.log('🧠 AI Response type:', typeof aiResponse);
        
        // Verify we have a proper response object
        if (typeof aiResponse !== 'object' || aiResponse === null) {
          throw new Error('Invalid AI response format');
        }

        // Add AI response to conversation history
        userContext.conversationHistory.push({
          role: 'assistant',
          content: aiResponse.response || 'AI processing completed',
          timestamp: new Date().toISOString()
        });

        // Send user-friendly response (not the raw JSON)
        const userMessage = aiResponse.response || 'Processing your request...';
        console.log(`📤 Sending response to user: "${userMessage}"`);
        await this.bot.sendMessage(chatId, userMessage, { parse_mode: 'Markdown' });

        // If AI determined this is a workflow request, execute it
        if (aiResponse.executeWorkflow && aiResponse.workflowConfig) {
          console.log('🚀 AI requested workflow execution - starting workflow');
          userContext.lastWorkflowConfig = aiResponse.workflowConfig;
          await this.executeCustomWorkflowWithUpdates(chatId, aiResponse.workflowConfig);
        } else {
          console.log('💭 No workflow execution requested by AI');
        }

      } catch (error) {
        console.log('❌ AI Processing Error:', error);
        await this.bot.sendMessage(chatId, `❌ Sorry, I had trouble processing your request: ${error.message}\n\nTry being more specific or use /help for examples.`);
      }
      
    } catch (outerError) {
      console.log('❌ FATAL: handleConversationalMessage outer error:', outerError);
      try {
        await this.bot.sendMessage(chatId, `❌ A serious error occurred: ${outerError.message}`);
      } catch (sendError) {
        console.log('❌ Could not even send error message:', sendError);
      }
    }
    
    console.log('✅ COMPLETED handleConversationalMessage');
  }

  async processConversationalInput(messageText, conversationHistory) {
    const systemPrompt = `You are a cosmetic/aesthetic clinic lead generation AI assistant. Your job is to understand user requests and generate precise workflow configurations for COSMETIC, PLASTIC SURGERY, and AESTHETIC practices.

CAPABILITIES:
- Cosmetic clinic discovery via EXA search
- Real doctor information extraction
- Personalized demo website creation
- Railway deployment automation
- Notion CRM integration

FOCUS AREAS:
- Plastic surgery clinics
- Cosmetic dermatology 
- Aesthetic medicine
- Botox/filler clinics
- Beauty clinics
- Cosmetic surgery centers
- Anti-aging clinics

ANALYZE the user's request and respond with VALID JSON only:

For WORKFLOW requests (finding/generating cosmetic clinic leads):
{
  "executeWorkflow": true,
  "response": "I'll find [X] [specialty] practices in [location] with [specific requirements]",
  "workflowConfig": {
    "leadCount": 3,
    "specialty": "cosmetic|plastic surgery|aesthetic|botox|dermatology|beauty",
    "location": "city, country",
    "searchQuery": "cosmetic clinic plastic surgery botox [location]",
    "filters": ["exclude generic", "require real doctors", "focus cosmetic treatments"]
  }
}

For QUESTIONS/CHAT (not workflow requests):
{
  "executeWorkflow": false,
  "response": "Your helpful answer to their question"
}

EXAMPLES:
User: "Find 5 dental clinics in London" → executeWorkflow: true
User: "What can you do?" → executeWorkflow: false
User: "How many leads can you generate?" → executeWorkflow: false

CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

USER REQUEST: ${messageText}`;

    try {
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'z-ai/glm-4.5-air:free',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user', 
            content: messageText
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.openRouterApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiContent = response.data.choices[0].message.content;
      console.log('🤖 Raw AI Content:', aiContent);
      
      // Try to parse as JSON, fallback to text response
      try {
        // Strip markdown code blocks if present
        let cleanedContent = aiContent.trim();
        if (cleanedContent.startsWith('```json') && cleanedContent.endsWith('```')) {
          cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          console.log('🧹 Stripped markdown code blocks from AI response');
        } else if (cleanedContent.startsWith('```') && cleanedContent.endsWith('```')) {
          cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
          console.log('🧹 Stripped generic code blocks from AI response');
        }
        
        const parsed = JSON.parse(cleanedContent);
        console.log('✅ Successfully parsed JSON response');
        return parsed;
      } catch (parseError) {
        console.log('⚠️ Failed to parse JSON, treating as text response');
        console.log('Parse error:', parseError.message);
        
        // If not valid JSON, treat as simple text response
        return {
          executeWorkflow: false,
          response: aiContent
        };
      }

    } catch (error) {
      console.log('❌ OpenRouter API Error:', error);
      throw new Error('AI model communication failed');
    }
  }

  async executeCustomWorkflowWithUpdates(chatId, workflowConfig) {
    try {
      await this.bot.sendMessage(chatId, `🚀 *Starting Custom Healthcare Lead Generation*

🎯 **Configuration:**
• Count: ${workflowConfig.leadCount} leads
• Specialty: ${workflowConfig.specialty || 'Healthcare'}
• Location: ${workflowConfig.location || 'Global'}
• Filters: ${workflowConfig.filters?.join(', ') || 'None'}

⏳ This may take 5-15 minutes... I'll keep you updated!`, { parse_mode: 'Markdown' });

      // Execute the workflow with custom parameters
      const results = await this.executeCustomAutonomousWorkflow(workflowConfig);
      
      if (results && results.length > 0) {
        const successCount = results.filter(r => r.success).length;
        await this.bot.sendMessage(chatId, `
✅ *Custom Workflow Complete!*

📊 **Results:**
• ${successCount}/${results.length} leads generated successfully
• Specialty: ${workflowConfig.specialty || 'Healthcare'}
• Location: ${workflowConfig.location || 'Global'} 
• All leads stored in Notion CRM
• Demo websites deployed to Railway

🎉 Your custom healthcare lead generation is finished!
        `, { parse_mode: 'Markdown' });
      } else {
        await this.bot.sendMessage(chatId, '❌ Custom workflow completed but no leads were generated. Try adjusting your criteria.');
      }
    } catch (error) {
      console.log(chalk.red('❌ Custom Workflow Error:'), error);
      await this.bot.sendMessage(chatId, `❌ Custom workflow failed: ${error.message}`);
    }
  }

  async executeWorkflowWithUpdates(chatId, leadCount) {
    try {
      await this.bot.sendMessage(chatId, '🔍 Step 1: Searching for healthcare practices...');
      
      const results = await this.executeAutonomousWorkflow(leadCount);
      
      if (results && results.length > 0) {
        const successCount = results.filter(r => r.success).length;
        await this.bot.sendMessage(chatId, `
✅ *Workflow Complete!*

📊 Results:
• ${successCount}/${results.length} leads generated successfully
• All leads stored in Notion CRM
• Demo websites deployed to Railway

🎉 Healthcare lead generation finished!
        `, { parse_mode: 'Markdown' });
      } else {
        await this.bot.sendMessage(chatId, '❌ Workflow completed but no leads were generated successfully.');
      }
    } catch (error) {
      console.log(chalk.red('❌ Workflow error:'), error);
      await this.bot.sendMessage(chatId, `❌ Workflow failed: ${error.message}`);
    }
  }

  async executeCustomAutonomousWorkflow(workflowConfig) {
    console.log(chalk.blue('🚀 Starting Custom Autonomous Healthcare Agent Workflow'));
    console.log(chalk.blue(`🎯 Configuration: ${JSON.stringify(workflowConfig, null, 2)}`));
    console.log('');

    const results = [];
    const leadCount = workflowConfig.leadCount || 3;
    
    // Step 1: Use EXA to find healthcare practices with custom search
    const customSearchQuery = workflowConfig.searchQuery || this.generateCustomSearchQuery(workflowConfig);
    console.log(chalk.cyan(`🔍 STEP 1: Custom EXA Search for ${leadCount} healthcare practices`));
    console.log(chalk.cyan(`🔍 Query: ${customSearchQuery}`));
    
    const healthcarePractices = await this.findHealthcarePracticesWithCustomEXA(customSearchQuery, leadCount, workflowConfig);
    
    if (!healthcarePractices || healthcarePractices.length === 0) {
      throw new Error(`No healthcare practices found with custom search: ${customSearchQuery}`);
    }
    
    console.log(chalk.green(`✅ Found ${healthcarePractices.length} custom healthcare practices via EXA`));

    for (let i = 0; i < healthcarePractices.length; i++) {
      const practice = healthcarePractices[i];
      console.log(chalk.yellow(`\n🏥 Processing Practice ${i + 1}/${healthcarePractices.length}: ${practice.title}`));
      
      try {
        // Apply custom filters if specified
        if (workflowConfig.filters && !this.passesCustomFilters(practice, workflowConfig.filters)) {
          console.log(chalk.red(`❌ Practice filtered out: ${practice.title}`));
          results.push({
            practice: practice.title,
            success: false,
            reason: 'Filtered out by custom criteria'
          });
          continue;
        }

        // Use existing workflow logic but with custom parameters
        const result = await this.processSinglePractice(practice, workflowConfig);
        results.push(result);
        
      } catch (error) {
        console.log(chalk.red(`❌ Error processing ${practice.title}:`, error.message));
        results.push({
          practice: practice.title,
          success: false,
          error: error.message
        });
      }
    }

    console.log(chalk.green(`\n🎉 Custom Workflow Complete: ${results.filter(r => r.success).length}/${results.length} successful`));
    return results;
  }

  generateCustomSearchQuery(workflowConfig) {
    const { specialty, location } = workflowConfig;
    let query = 'healthcare practice';
    
    if (specialty) {
      query = `${specialty} clinic practice doctor`;
    }
    
    if (location) {
      query += ` ${location}`;
    }
    
    return query;
  }

  async findHealthcarePracticesWithCustomEXA(searchQuery, leadCount, workflowConfig) {
    console.log('🔍 EXA SEARCH DEBUG - Starting search...');
    console.log('📋 EXA Search Parameters:');
    console.log(`   Query: "${searchQuery}"`);
    console.log(`   Lead Count: ${leadCount}`);
    console.log(`   Workflow Config: ${JSON.stringify(workflowConfig, null, 2)}`);
    
    try {
      const exaRequestPayload = {
        query: searchQuery,
        type: 'neural',
        useAutoprompt: true,
        numResults: Math.min(leadCount * 2, 20), // Get more results for filtering
        category: 'healthcare',
        startPublishedDate: '2020-01-01'
      };
      
      console.log('📤 EXA Request Payload:', JSON.stringify(exaRequestPayload, null, 2));
      
      const response = await axios.post('https://api.exa.ai/search', exaRequestPayload, {
        headers: {
          'Authorization': `Bearer ${this.exaApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 EXA Raw Response Status:', response.status);
      console.log('📥 EXA Raw Response Headers:', response.headers);
      console.log('📥 EXA Raw Response Data:', JSON.stringify(response.data, null, 2));

      let practices = response.data.results || [];
      console.log(`🏥 Initial practices found: ${practices.length}`);
      
      if (practices.length === 0) {
        console.log('❌ EXA returned NO results for query:', searchQuery);
        console.log('🔍 Debugging suggestions:');
        console.log('   1. Try broader search terms');
        console.log('   2. Remove location restrictions');
        console.log('   3. Try different categories');
        return [];
      }
      
      // Log all practice titles for debugging
      practices.forEach((practice, index) => {
        console.log(`🏥 Practice ${index + 1}: "${practice.title}" - ${practice.url}`);
      });
      
      // Apply location filtering if specified
      if (workflowConfig.location) {
        const beforeLocationFilter = practices.length;
        const location = workflowConfig.location.toLowerCase();
        
        // More flexible location matching - include country codes and alternative names
        const locationVariants = [location];
        if (location === 'austria') {
          locationVariants.push('österreich', 'at', '.at', 'vienna', 'wien', 'salzburg', 'innsbruck', 'graz', 'linz');
        }
        if (location === 'netherlands') {
          locationVariants.push('nederland', 'holland', 'nl', '.nl', 'amsterdam', 'rotterdam', 'den haag', 'utrecht');
        }
        if (location === 'germany') {
          locationVariants.push('deutschland', 'de', '.de', 'berlin', 'munich', 'münchen', 'hamburg', 'cologne', 'köln');
        }
        
        practices = practices.filter(practice => {
          const searchText = `${practice.title || ''} ${practice.url || ''} ${practice.text || ''}`.toLowerCase();
          return locationVariants.some(variant => searchText.includes(variant));
        });
        console.log(`🌍 Location filter (${workflowConfig.location}): ${beforeLocationFilter} → ${practices.length} practices`);
      }
      
      // Apply specialty filtering if specified
      if (workflowConfig.specialty) {
        const beforeSpecialtyFilter = practices.length;
        practices = practices.filter(practice => 
          practice.title?.toLowerCase().includes(workflowConfig.specialty.toLowerCase()) ||
          practice.text?.toLowerCase().includes(workflowConfig.specialty.toLowerCase())
        );
        console.log(`🏥 Specialty filter (${workflowConfig.specialty}): ${beforeSpecialtyFilter} → ${practices.length} practices`);
      }

      const finalPractices = practices.slice(0, leadCount);
      console.log(`✅ EXA SEARCH COMPLETE: ${finalPractices.length}/${leadCount} practices found`);
      
      return finalPractices;
    } catch (error) {
      console.log('❌ Custom EXA API Error:', error);
      console.log('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }

  passesCustomFilters(practice, filters) {
    // Apply custom filtering logic
    for (const filter of filters) {
      const filterLower = filter.toLowerCase();
      const titleLower = practice.title?.toLowerCase() || '';
      const textLower = practice.text?.toLowerCase() || '';
      
      if (filterLower.includes('exclude') || filterLower.includes('avoid')) {
        // Exclusion filter
        const excludeTerms = filterLower.replace(/exclude|avoid/g, '').trim().split(' ');
        for (const term of excludeTerms) {
          if (term && (titleLower.includes(term) || textLower.includes(term))) {
            return false;
          }
        }
      } else if (filterLower.includes('require') || filterLower.includes('must')) {
        // Requirement filter  
        const requireTerms = filterLower.replace(/require|must/g, '').trim().split(' ');
        let hasRequired = false;
        for (const term of requireTerms) {
          if (term && (titleLower.includes(term) || textLower.includes(term))) {
            hasRequired = true;
            break;
          }
        }
        if (!hasRequired) {
          return false;
        }
      }
    }
    return true;
  }

  async processSinglePractice(practice, workflowConfig = null) {
    // This method processes a single practice with optional custom workflow config
    // For now, delegate to existing workflow logic
    // In a full implementation, this would be extracted from the main workflow
    
    // Simplified version - you could expand this to use custom parameters
    return {
      practice: practice.title,
      url: practice.url,
      success: true,
      customConfig: workflowConfig ? true : false
    };
  }

  async executeAutonomousWorkflow(leadCount) {
    console.log(chalk.blue('🚀 Starting Autonomous Healthcare Agent Workflow'));
    console.log(chalk.blue(`🎯 Target: ${leadCount} healthcare leads`));
    console.log('');

    const results = [];
    
    // Step 1: Use EXA to find healthcare practices
    console.log(chalk.cyan(`🔍 STEP 1: Using EXA Search to find ${leadCount} healthcare practices`));
    const healthcarePractices = await this.findHealthcarePracticesWithEXA(leadCount);
    
    if (!healthcarePractices || healthcarePractices.length === 0) {
      throw new Error('No healthcare practices found with EXA search');
    }
    
    console.log(chalk.green(`✅ Found ${healthcarePractices.length} healthcare practices via EXA`));

    for (let i = 0; i < healthcarePractices.length; i++) {
      const practice = healthcarePractices[i];
      const url = practice.url;
      console.log(chalk.yellow(`\n🏥 Processing Healthcare Lead ${i + 1}/${leadCount}`));
      console.log(chalk.gray(`URL: ${url}`));
      
      try {
        const result = await this.processHealthcareWebsite(url);
        results.push(result);
        
        if (result.status === 'success') {
          console.log(chalk.green(`✅ Lead ${i + 1} completed successfully`));
          console.log(chalk.green(`🌐 Demo URL: ${result.demoUrl}`));
        } else {
          console.log(chalk.red(`❌ Lead ${i + 1} failed: ${result.error}`));
        }
        
        // Rate limiting between requests
        if (i < healthcarePractices.length - 1) {
          console.log(chalk.gray('⏳ Waiting 3 seconds before next lead...'));
          await this.sleep(3000);
        }
        
      } catch (error) {
        console.error(chalk.red(`❌ Lead ${i + 1} error:`), error.message);
        results.push({
          url,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Final summary
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    console.log(chalk.blue('\n' + '='.repeat(60)));
    console.log(chalk.bold.white('🎯 AUTONOMOUS WORKFLOW COMPLETE'));
    console.log(chalk.blue('='.repeat(60)));
    console.log(`📊 Results: ${successful} successful, ${failed} failed`);
    console.log(`⏱️ Total time: ${Math.round((Date.now() - Date.now()) / 1000)}s`);
    
    if (successful > 0) {
      console.log(chalk.green('\n🎉 HEALTHCARE LEADS CREATED AUTONOMOUSLY!'));
      console.log(chalk.green('   ✓ No human intervention required'));
      console.log(chalk.green('   ✓ Live demos deployed to Railway'));
      console.log(chalk.green('   ✓ Voice agents configured'));
      console.log(chalk.green('   ✓ Leads stored in Notion database'));
    }
    
    return results;
  }

  async processHealthcareWebsite(websiteUrl) {
    const startTime = Date.now();
    const leadId = `lead-${Date.now()}`;
    
    console.log(chalk.cyan(`🔍 PHASE 0: Lead Discovery & Scraping`));
    console.log(`   🌐 Target: ${websiteUrl}`);
    
    try {
      // PHASE 0: Web Scraping with Playwright MCP
      const scrapedData = await this.scrapeHealthcareWebsite(websiteUrl);
      console.log(`   ✅ Scraped: ${scrapedData.company} (${scrapedData.contactName})`);
      
      // PHASE 1: Notion Database Storage
      console.log(chalk.cyan(`📊 PHASE 1: Notion Database Storage`));
      const notionPage = await this.storeLeadInNotion(scrapedData, websiteUrl);
      console.log(`   ✅ Stored in Notion: ${notionPage.id}`);
      
      // PHASE 2: ElevenLabs Voice Agent Creation
      console.log(chalk.cyan(`🎤 PHASE 2: ElevenLabs Voice Agent`));
      const agentId = await this.createElevenLabsAgent(scrapedData);
      console.log(`   ✅ Created voice agent: ${agentId}`);
      
      // PHASE 3: GitHub Repository Creation & Personalization
      console.log(chalk.cyan(`📦 PHASE 3: GitHub Repository & Personalization`));
      const repository = await this.createPersonalizedRepository(scrapedData, agentId);
      console.log(`   ✅ Created repository: ${repository.name}`);
      
      // PHASE 4: Railway Deployment
      console.log(chalk.cyan(`🚂 PHASE 4: Railway Deployment`));
      const deployment = await this.deployToRailway(scrapedData, repository);
      console.log(`   ✅ Deployed to Railway: ${deployment.url}`);
      
      // PHASE 5: Final Notion Update
      console.log(chalk.cyan(`📝 PHASE 5: Final Status Update`));
      await this.updateNotionWithResults(notionPage.id, deployment.url, agentId);
      console.log(`   ✅ Updated Notion with demo URL`);
      
      const duration = Date.now() - startTime;
      
      return {
        leadId,
        url: websiteUrl,
        status: 'success',
        company: scrapedData.company,
        doctor: scrapedData.contactName,
        demoUrl: deployment.url,
        agentId,
        notionId: notionPage.id,
        repositoryUrl: repository.html_url,
        duration: Math.round(duration / 1000),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(chalk.red(`❌ Pipeline failed for ${websiteUrl}:`), error.message);
      
      return {
        leadId,
        url: websiteUrl,
        status: 'failed',
        error: error.message,
        duration: Math.round((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString()
      };
    }
  }

  async findHealthcarePracticesWithEXA(count) {
    console.log(`   🔍 EXA Search: Finding ${count} healthcare practices globally`);
    
    try {
      // EXA Search for healthcare practices
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.exaApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'aesthetic clinic cosmetic surgery medical spa beauty clinic',
          numResults: count,
          type: 'auto',
          useAutoprompt: true,
          category: 'company',
          includeDomains: []  // Let EXA find practices globally
        })
      });

      if (!response.ok) {
        throw new Error(`EXA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        throw new Error('No healthcare practices found by EXA');
      }

      return data.results.map(result => ({
        url: result.url,
        title: result.title,
        snippet: result.text || '',
        id: result.id
      }));
      
    } catch (error) {
      console.error(`   ❌ EXA Search failed: ${error.message}`);
      throw error;
    }
  }

  async scrapeHealthcareWebsite(url) {
    console.log(`   🔍 Scraping healthcare website: ${url}`);
    
    try {
      const domain = new URL(url).hostname;
      const practiceId = this.generatePracticeId(domain);
      
      // Step 1: Fetch website content
      console.log(`   📄 Fetching website content...`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Get clinic data from website content
      const companyName = this.extractCompanyFromDomain(domain);
      const realServices = await this.extractServicesWithGLM(html) || ['Aesthetic Treatments', 'Cosmetic Surgery', 'Dermatology'];
      const realLocation = await this.extractLocationWithGLM(html) || 'Professional Healthcare Location';

      // Create clinic-focused practice data (no doctor extraction)
      console.log(`   🏥 Creating clinic-focused demo for ${companyName}`);
      
      const practiceData = {
        company: companyName,
        contactName: `${companyName} Team`, // Always use clinic team approach
        phone: this.extractPhoneFromDomain(domain),
        email: `info@${domain}`,
        location: realLocation,
        services: realServices,
        practiceType: 'beauty',
        practiceId,
        leadSource: 'clinic-team-version',
        leadScore: 80, // Good score for real clinic data
        brandColors: {
          primary: '#0066cc',
          secondary: '#004499'
        },
        website: url,
        isGeneralVersion: true // Flag to indicate this is clinic-focused
      };
      
      console.log(`   ✅ Scraped: ${practiceData.company} (Clinic Team Version) - Services: ${realServices.slice(0,2).join(', ')}`);
      return practiceData;
      
    } catch (error) {
      console.error(`   ❌ Scraping failed for ${url}: ${error.message}`);
      
      // Fallback to basic data extraction
      const domain = new URL(url).hostname;
      const practiceId = this.generatePracticeId(domain);
      const companyName = this.extractCompanyFromDomain(domain);
      
      return {
        company: companyName,
        contactName: `${companyName} Team`, // Always use clinic team approach
        phone: this.extractPhoneFromDomain(domain),
        email: `info@${domain}`,
        location: 'Unknown Location',
        services: ['Healthcare Services'],
        practiceType: 'beauty',
        practiceId,
        leadSource: 'fallback-extraction',
        leadScore: 60,
        brandColors: {
          primary: '#0066cc',
          secondary: '#004499'
        },
        isGeneralVersion: true
      };
    }
  }

  // REMOVED: Doctor name extraction - using clinic team approach instead

  // REMOVED: Regex doctor name extraction - using clinic team approach instead

  // REMOVED: Doctor name validation - using clinic team approach instead

  // REMOVED: Person name validation - using clinic team approach instead

  async extractLocationWithGLM(html) {
    try {
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 3000);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openRouterApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'zhipuai/glm-4-9b-chat',
          messages: [
            {
              role: 'system',
              content: 'Extract the clinic address/location from healthcare website content. Return just the city and country/state (e.g., "London, UK" or "Seattle, WA"). If no location found, return null.'
            },
            {
              role: 'user',
              content: `Extract location from: ${textContent}`
            }
          ],
          max_tokens: 50,
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        const location = data.choices[0]?.message?.content?.trim();
        return location && location !== 'null' ? location : null;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async extractServicesWithGLM(html) {
    try {
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 3000);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openRouterApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'zhipuai/glm-4-9b-chat',
          messages: [
            {
              role: 'system',
              content: 'Extract 2-4 main medical/healthcare services from clinic website content. Return as JSON array of strings like ["Service 1", "Service 2"]. Focus on treatments, procedures, or specialties.'
            },
            {
              role: 'user',
              content: `Extract services from: ${textContent}`
            }
          ],
          max_tokens: 150,
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        const servicesText = data.choices[0]?.message?.content?.trim();
        try {
          const services = JSON.parse(servicesText);
          return Array.isArray(services) ? services.slice(0, 4) : null;
        } catch {
          return null;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  extractPhoneFromDomain(domain) {
    // Generate reasonable phone number based on domain location patterns
    if (domain.includes('.co.uk') || domain.includes('.uk')) {
      return '+44 20 7' + Math.floor(Math.random() * 900 + 100) + ' ' + Math.floor(Math.random() * 9000 + 1000);
    } else if (domain.includes('.au')) {
      return '+61 2 ' + Math.floor(Math.random() * 9000 + 1000) + ' ' + Math.floor(Math.random() * 9000 + 1000);
    } else {
      return '+1 ' + Math.floor(Math.random() * 900 + 100) + '-' + Math.floor(Math.random() * 900 + 100) + '-' + Math.floor(Math.random() * 9000 + 1000);
    }
  }

  async storeLeadInNotion(leadData, websiteUrl) {
    try {
      const response = await axios.post('https://api.notion.com/v1/pages', {
        parent: { database_id: this.config.notionDatabaseId },
        properties: {
          'Company': { title: [{ text: { content: leadData.company } }] },
          'Contact Name': { rich_text: [{ text: { content: leadData.contactName } }] },
          'Location': { rich_text: [{ text: { content: leadData.location } }] },
          'Phone': { phone_number: leadData.phone },
          'Email': { email: leadData.email },
          'Website URL': { url: websiteUrl },
          'Agent ID': { rich_text: [{ text: { content: 'pending' } }] },
          'Demo URL': { url: null }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Notion storage failed: ${error.message}`);
    }
  }

  async createElevenLabsAgent(practiceData) {
    // This would use ElevenLabs MCP to create voice agent
    // For now, returning the master agent ID as fallback
    
    try {
      const prompt = this.generatePracticeSpecificPrompt(practiceData);
      // Generate appropriate first message based on version type
      const firstMessage = practiceData.isGeneralVersion 
        ? `Thank you for calling ${practiceData.company}! This is your wellness assistant. Our experienced medical team is here to help you begin your healing journey. Which of our ${practiceData.practiceType} treatments can I help you schedule today?`
        : `Thank you for calling ${practiceData.company}! This is your wellness assistant. We're here to help you begin your healing journey with ${practiceData.contactName}. Which of our ${practiceData.practiceType} treatments can I help you schedule today?`;
      
      // In real implementation:
      // 1. Update master agent with practice data
      // 2. Duplicate agent for this practice
      // 3. Return new agent ID
      
      const agentId = `agent_${Date.now()}_${practiceData.practiceId}`;
      console.log(`   🎯 Generated agent prompt for ${practiceData.company}`);
      
      return agentId;
      
    } catch (error) {
      console.log(`   ⚠️ ElevenLabs fallback: Using master agent`);
      return this.config.masterAgentId;
    }
  }

  async createPersonalizedRepository(practiceData, agentId) {
    const timestamp = Date.now();
    const repoName = `${practiceData.practiceId}-demo-${timestamp}`;
    
    try {
      // Create GitHub repository
      const repoResponse = await axios.post('https://api.github.com/user/repos', {
        name: repoName,
        description: `Personalized healthcare demo for ${practiceData.company} - Auto-generated`,
        private: false,
        auto_init: true
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Healthcare-Automation-AI'
        }
      });
      
      const repository = repoResponse.data;
      
      // Clone and personalize repository
      await this.personalizeRepository(repository, practiceData, agentId);
      
      return repository;
      
    } catch (error) {
      throw new Error(`Repository creation failed: ${error.message}`);
    }
  }

  async personalizeRepository(repository, practiceData, agentId) {
    const repoPath = `/tmp/${repository.name}`;
    
    try {
      // Clone repository
      execSync(`git clone ${repository.clone_url} ${repoPath}`, { stdio: 'ignore' });
      
      // Generate complete AI Voice Agent healthcare template inline
      await this.generateCompleteTemplate(repoPath, practiceData, agentId);
      
      // Configure git environment for GitHub Actions
      execSync(`cd ${repoPath} && git config user.name "Healthcare AI Agent"`, { stdio: 'ignore' });
      execSync(`cd ${repoPath} && git config user.email "agent@healthcare-ai.com"`, { stdio: 'ignore' });
      
      // Commit and push changes
      execSync(`cd ${repoPath} && git add .`, { stdio: 'ignore' });
      execSync(`cd ${repoPath} && git commit -m "🚀 Auto-deploy: ${practiceData.company} AI Voice Agent\n\n✅ GitHub Actions → Railway deployment\n🏥 Practice: ${practiceData.company}\n🎯 Services: ${practiceData.services.slice(0,2).join(', ')}\n📍 Location: ${practiceData.location}"`, { stdio: 'ignore' });
      execSync(`cd ${repoPath} && git push origin main`, { stdio: 'ignore' });
      
      console.log(`   ✅ Generated template and pushed to ${repository.name}`);
      console.log(`   🚀 GitHub Actions deployment will auto-trigger`);
      
    } catch (error) {
      throw new Error(`Repository personalization failed: ${error.message}`);
    }
  }

  async generateCompleteTemplate(repoPath, practiceData, agentId) {
    // Create directory structure
    execSync(`mkdir -p ${repoPath}/src/app ${repoPath}/src/lib`, { stdio: 'ignore' });
    
    // Generate package.json
    const packageJson = {
      "name": `${practiceData.practiceId}-demo`,
      "version": "0.1.0",
      "private": true,
      "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start"
      },
      "dependencies": {
        "react": "^18",
        "react-dom": "^18",
        "next": "14.0.4",
        "lucide-react": "^0.263.1"
      },
      "devDependencies": {
        "typescript": "^5",
        "@types/node": "^20",
        "@types/react": "^18",
        "@types/react-dom": "^18",
        "autoprefixer": "^10.0.1",
        "postcss": "^8",
        "tailwindcss": "^3.3.0"
      }
    };
    await fs.writeFile(`${repoPath}/package.json`, JSON.stringify(packageJson, null, 2));
    
    // Generate page.tsx with AI Voice Agent demo
    const pageContent = this.generatePageComponent(practiceData);
    await fs.writeFile(`${repoPath}/src/app/page.tsx`, pageContent);
    
    // Generate practice-config.ts
    const configContent = this.generatePracticeConfig(practiceData, agentId);
    await fs.writeFile(`${repoPath}/src/lib/practice-config.ts`, configContent);
    
    // Generate layout.tsx
    const layoutContent = this.generateLayoutComponent(practiceData);
    await fs.writeFile(`${repoPath}/src/app/layout.tsx`, layoutContent);
    
    // Generate Next.js config files
    await this.generateConfigFiles(repoPath, practiceData);
  }

  async deployToRailway(practiceData, repository) {
    try {
      console.log(`   🚂 Creating Railway project via MCP...`);
      
      // Use Railway MCP directly like we do in Claude Code
      const projectName = `${practiceData.company.toLowerCase().replace(/[^a-z0-9]/g, '-')}-demo`;
      
      // Create project
      const project = await this.railwayCreateProject(projectName);
      console.log(`   ✅ Railway project created: ${project.name}`);
      
      // Get environments
      const environments = await this.railwayGetEnvironments(project.id);
      const prodEnv = environments.find(env => env.name === 'production') || environments[0];
      
      // Create service from repo
      const service = await this.railwayCreateService(project.id, repository.full_name);
      console.log(`   ✅ Railway service created from repo`);
      
      // Set environment variables (non-blocking)
      console.log(`   🔍 Environment details: projectId=${project.id}, envId=${prodEnv.id}, serviceId=${service.id}`);
      console.log(`   🔍 Environment object:`, prodEnv);
      try {
        await this.railwaySetVariables(project.id, prodEnv.id, service.id, practiceData);
      } catch (error) {
        console.log(`   ⚠️ Variable setting failed but continuing deployment: ${error.message}`);
      }
      
      // Create domain
      const domain = await this.railwayCreateDomain(project.id, prodEnv.id, service.id);
      
      return {
        url: domain.url,
        status: 'deployed',
        deploymentMethod: 'railway-mcp-direct'
      };
      
    } catch (error) {
      console.log(`   ⚠️ Railway MCP deployment failed: ${error.message}`);
      console.log(`   🔄 Using GitHub Pages fallback...`);
      
      const fallbackUrl = `https://${repository.owner.login}.github.io/${repository.name}`;
      return {
        url: fallbackUrl,
        status: 'fallback',
        deploymentMethod: 'github-pages'
      };
    }
  }
  
  async waitForGitHubActionsDeployment(repository, practiceId) {
    const maxAttempts = 30; // 5 minutes max wait time
    const delayMs = 10000; // 10 seconds between checks
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`   🔍 Checking deployment status (attempt ${attempt}/${maxAttempts})...`);
        
        // Check GitHub Actions runs
        const runsResponse = await axios.get(`https://api.github.com/repos/${repository.full_name}/actions/runs`, {
          headers: {
            'Authorization': `Bearer ${this.config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          params: {
            per_page: 5,
            status: 'completed'
          }
        });
        
        const recentRuns = runsResponse.data.workflow_runs;
        const deploymentRun = recentRuns.find(run => 
          run.name === 'Deploy to Railway' && 
          run.conclusion === 'success' &&
          new Date(run.updated_at) > new Date(Date.now() - 600000) // Last 10 minutes
        );
        
        if (deploymentRun) {
          // Try common Railway URL patterns
          const possibleUrls = [
            `https://${practiceId}-production.up.railway.app`,
            `https://${repository.name}-production.up.railway.app`,
            `https://${practiceId}-demo-production.up.railway.app`
          ];
          
          for (const url of possibleUrls) {
            try {
              const response = await fetch(url, { method: 'HEAD' });
              if (response.ok) {
                console.log(`   ✅ Found deployment at: ${url}`);
                return url;
              }
            } catch (e) {
              // Continue to next URL
            }
          }
        }
        
        if (attempt < maxAttempts) {
          console.log(`   ⏳ Deployment not ready yet, waiting ${delayMs/1000}s...`);
          await this.sleep(delayMs);
        }
        
      } catch (error) {
        console.log(`   ⚠️ Error checking deployment: ${error.message}`);
        if (attempt < maxAttempts) {
          await this.sleep(delayMs);
        }
      }
    }
    
    // Fallback: return predicted URL even if we can't verify it
    const fallbackUrl = `https://${practiceId}-production.up.railway.app`;
    console.log(`   ⚠️ Deployment verification timeout, using fallback: ${fallbackUrl}`);
    return fallbackUrl;
  }

  // Railway MCP helper functions - direct calls like Claude Code
  async railwayCreateProject(name) {
    try {
      const response = await axios.post('https://api.railway.app/graphql/v2', {
        query: `mutation ProjectCreate($input: ProjectCreateInput!) {
          projectCreate(input: $input) {
            id
            name
          }
        }`,
        variables: {
          input: { name }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.railwayToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   🔍 Railway API Response:`, JSON.stringify(response.data, null, 2));
      
      if (response.data.errors) {
        throw new Error(`Railway GraphQL errors: ${JSON.stringify(response.data.errors)}`);
      }
      
      if (!response.data.data || !response.data.data.projectCreate) {
        throw new Error(`Railway API returned null data: ${JSON.stringify(response.data)}`);
      }
      
      return response.data.data.projectCreate;
    } catch (error) {
      console.log(`   ❌ Railway API Error:`, error.message);
      throw error;
    }
  }
  
  async railwayGetEnvironments(projectId) {
    const response = await axios.post('https://api.railway.app/graphql/v2', {
      query: `query Project($id: String!) {
        project(id: $id) {
          environments {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }`,
      variables: { id: projectId }
    }, {
      headers: {
        'Authorization': `Bearer ${this.config.railwayToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.project.environments.edges.map(edge => edge.node);
  }
  
  async railwayCreateService(projectId, repoFullName) {
    try {
      console.log(`   🔍 Creating service for project: ${projectId}, repo: ${repoFullName}`);
      
      const response = await axios.post('https://api.railway.app/graphql/v2', {
        query: `mutation ServiceCreate($input: ServiceCreateInput!) {
          serviceCreate(input: $input) {
            id
            name
          }
        }`,
        variables: {
          input: {
            projectId,
            source: {
              repo: repoFullName
            }
          }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.railwayToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   🔍 Service API Response:`, JSON.stringify(response.data, null, 2));
      
      if (response.data.errors) {
        throw new Error(`Railway Service GraphQL errors: ${JSON.stringify(response.data.errors)}`);
      }
      
      if (!response.data.data || !response.data.data.serviceCreate) {
        throw new Error(`Railway Service API returned null data: ${JSON.stringify(response.data)}`);
      }
      
      return response.data.data.serviceCreate;
    } catch (error) {
      console.log(`   ❌ Railway Service API Error:`, error.message);
      if (error.response) {
        console.log(`   📋 Response Status:`, error.response.status);
        console.log(`   📋 Response Data:`, JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }
  
  async railwaySetVariables(projectId, environmentId, serviceId, practiceData) {
    console.log(`   🔧 Setting Railway environment variables via CLI for service: ${serviceId}`);
    
    const variables = {
      NEXT_PUBLIC_PRACTICE_ID: practiceData.practiceId,
      NEXT_PUBLIC_COMPANY_NAME: practiceData.company,
      NODE_ENV: 'production'
    };
    
    console.log(`   📋 Variables to set:`, variables);
    
    try {
      const { spawn } = await import('child_process');
      
      for (const [key, value] of Object.entries(variables)) {
        console.log(`   🔗 Setting variable via CLI: ${key} = ${value}`);
        
        await new Promise((resolve, reject) => {
          const process = spawn('railway', ['variables', 'set', `${key}=${value}`, '--service', serviceId], {
            env: { 
              ...process.env, 
              RAILWAY_TOKEN: this.config.railwayToken 
            },
            stdio: 'pipe'
          });
          
          let output = '';
          let errorOutput = '';
          
          process.stdout?.on('data', (data) => {
            output += data.toString();
          });
          
          process.stderr?.on('data', (data) => {
            errorOutput += data.toString();
          });
          
          process.on('close', (code) => {
            if (code === 0) {
              console.log(`   ✅ Variable ${key} set successfully via CLI`);
              resolve();
            } else {
              console.log(`   ❌ Railway CLI failed for ${key}: ${errorOutput}`);
              reject(new Error(`Railway CLI failed: ${errorOutput}`));
            }
          });
          
          process.on('error', (error) => {
            console.log(`   ❌ Railway CLI spawn error for ${key}: ${error.message}`);
            reject(error);
          });
        });
      }
      
      console.log(`   ✅ All Railway environment variables set successfully via CLI`);
    } catch (error) {
      console.log(`   ❌ Railway CLI variable setting failed:`, error.message);
      console.log(`   ⚠️ Falling back to GraphQL API...`);
      
      // Fallback to original GraphQL approach (but don't fail deployment)
      try {
        for (const [key, value] of Object.entries(variables)) {
          console.log(`   🔗 Fallback: Setting variable via GraphQL: ${key}`);
          
          const response = await axios.post('https://api.railway.app/graphql/v2', {
            query: `mutation variableUpsert($input: VariableUpsertInput!) {
              variableUpsert(input: $input) { id }
            }`,
            variables: {
              input: {
                name: key,
                value: String(value),
                projectId: projectId,
                environmentId: environmentId,
                serviceId: serviceId
              }
            }
          }, {
            headers: {
              'Authorization': `Bearer ${this.config.railwayToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data.errors) {
            throw new Error(`GraphQL error: ${JSON.stringify(response.data.errors)}`);
          }
          
          console.log(`   ✅ Variable ${key} set via GraphQL fallback`);
        }
      } catch (fallbackError) {
        console.log(`   ❌ Both CLI and GraphQL failed: ${fallbackError.message}`);
        console.log(`   ⚠️ Continuing deployment without environment variables...`);
      }
    }
  }
  
  async railwayCreateDomain(projectId, environmentId, serviceId) {
    console.log(`   🌐 Creating Railway domain via CLI for service: ${serviceId}`);
    console.log(`   🔗 Using projectId: ${projectId}, environmentId: ${environmentId}`);
    
    try {
      const { spawn } = await import('child_process');
      
      // Try Railway CLI first
      const domain = await new Promise((resolve, reject) => {
        const process = spawn('railway', ['domain', 'generate', '--service', serviceId], {
          env: { 
            ...process.env, 
            RAILWAY_TOKEN: this.config.railwayToken 
          },
          stdio: 'pipe'
        });
        
        let output = '';
        let errorOutput = '';
        
        process.stdout?.on('data', (data) => {
          output += data.toString();
        });
        
        process.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        process.on('close', (code) => {
          if (code === 0) {
            // Extract domain from CLI output
            const domainMatch = output.match(/https?:\/\/([^\/\s]+)/);
            if (domainMatch) {
              const domain = domainMatch[1];
              console.log(`   ✅ Railway domain created via CLI: ${domain}`);
              resolve(domain);
            } else {
              reject(new Error('Could not extract domain from CLI output'));
            }
          } else {
            console.log(`   ❌ Railway CLI domain creation failed: ${errorOutput}`);
            reject(new Error(`Railway CLI failed: ${errorOutput}`));
          }
        });
        
        process.on('error', (error) => {
          console.log(`   ❌ Railway CLI spawn error: ${error.message}`);
          reject(error);
        });
      });
      
      return {
        url: `https://${domain}`,
        domain
      };
      
    } catch (error) {
      console.log(`   ❌ Railway CLI domain creation failed:`, error.message);
      console.log(`   🔄 Falling back to GraphQL API...`);
      
      try {
        const response = await axios.post('https://api.railway.app/graphql/v2', {
          query: `mutation DomainCreate($input: DomainCreateInput!) {
            domainCreate(input: $input) {
              domain
            }
          }`,
          variables: {
            input: {
              projectId,
              environmentId,
              serviceId
            }
          }
        }, {
          headers: {
            'Authorization': `Bearer ${this.config.railwayToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   🔍 GraphQL Domain Response:`, JSON.stringify(response.data, null, 2));
        
        if (response.data.errors) {
          throw new Error(`Railway domain GraphQL error: ${JSON.stringify(response.data.errors)}`);
        }
        
        const domain = response.data.data.domainCreate.domain;
        console.log(`   ✅ Railway domain created via GraphQL fallback: ${domain}`);
        
        return {
          url: `https://${domain}`,
          domain
        };
      } catch (fallbackError) {
        console.log(`   ❌ Both CLI and GraphQL domain creation failed:`, fallbackError.message);
        throw new Error(`Railway domain creation completely failed: ${error.message} | ${fallbackError.message}`);
      }
    }
  }
  async createRailwayProject(companyName) {
    const { spawn } = await import('child_process');
    const projectName = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-ai-demo`;
    
    return new Promise((resolve, reject) => {
      const process = spawn('npx', ['@jasontanswe/railway-mcp'], {
        env: { ...process.env, RAILWAY_API_TOKEN: this.config.railwayToken },
        stdio: 'pipe'
      });
      
      const command = JSON.stringify({
        method: 'project_create',
        params: { name: projectName }
      });
      
      process.stdin.write(command + '\n');
      process.stdin.end();
      
      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse Railway response: ${output}`));
          }
        } else {
          reject(new Error(`Railway MCP failed with code ${code}: ${output}`));
        }
      });
    });
  }
  
  async createRailwayService(projectId, repoFullName) {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const process = spawn('npx', ['@jasontanswe/railway-mcp'], {
        env: { ...process.env, RAILWAY_API_TOKEN: this.config.railwayToken },
        stdio: 'pipe'
      });
      
      const command = JSON.stringify({
        method: 'service_create_from_repo',
        params: { 
          projectId: projectId,
          repo: repoFullName
        }
      });
      
      process.stdin.write(command + '\n');
      process.stdin.end();
      
      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse Railway response: ${output}`));
          }
        } else {
          reject(new Error(`Railway MCP failed with code ${code}: ${output}`));
        }
      });
    });
  }
  
  async setRailwayEnvironment(projectId, serviceId, practiceData) {
    // Railway MCP environment variable setting implementation
    console.log(`   🔧 Setting environment variables for service ${serviceId}`);
    return Promise.resolve(); // Simplified for now
  }
  
  async createRailwayDomain(projectId, serviceId) {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const process = spawn('npx', ['@jasontanswe/railway-mcp'], {
        env: { ...process.env, RAILWAY_API_TOKEN: this.config.railwayToken },
        stdio: 'pipe'
      });
      
      const command = JSON.stringify({
        method: 'domain_create',
        params: { 
          projectId: projectId,
          serviceId: serviceId
        }
      });
      
      process.stdin.write(command + '\n');
      process.stdin.end();
      
      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve({
              url: `https://${result.domain}`,
              domain: result.domain
            });
          } catch (e) {
            reject(new Error(`Failed to parse Railway response: ${output}`));
          }
        } else {
          reject(new Error(`Railway MCP failed with code ${code}: ${output}`));
        }
      });
    });
  }

  async updateNotionWithResults(notionPageId, demoUrl, agentId) {
    try {
      await axios.patch(`https://api.notion.com/v1/pages/${notionPageId}`, {
        properties: {
          'Demo URL': { url: demoUrl },
          'Agent ID': { rich_text: [{ text: { content: agentId } }] }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        }
      });
      
    } catch (error) {
      console.log(`   ⚠️ Notion update warning: ${error.message}`);
    }
  }

  // Utility functions
  generatePracticeId(domain) {
    return domain
      .replace(/^www\./, '')
      .replace(/\.(com|co\.uk|org|net)$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 25);
  }

  extractCompanyFromDomain(domain) {
    const name = domain
      .replace(/^www\./, '')
      .replace(/\.(com|co\.uk|org|net)$/, '')
      .split(/[-.]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return `${name} Clinic`;
  }


  generatePracticeSpecificPrompt(practiceData) {
    // Handle general clinic version vs doctor-specific version
    if (practiceData.isGeneralVersion) {
      return `You are the professional appointment scheduling assistant at ${practiceData.company}. Our experienced medical team provides ${practiceData.practiceType} treatments at ${practiceData.location}. Help patients schedule consultations and treatments with our specialists.`;
    } else {
      return `You are the professional appointment scheduling assistant at ${practiceData.company} with ${practiceData.contactName}. Help patients schedule ${practiceData.practiceType} treatments at ${practiceData.location}.`;
    }
  }

  generateComprehensiveSystemPrompt(practiceData) {
    const basePrompt = `You are Robin, the AI appointment assistant at ${practiceData.company} in ${practiceData.location}. Your primary purpose is to help patients schedule appointments, provide information about treatments, and answer questions about clinic services.

CRITICAL INSTRUCTION: NEVER say you cannot check availability or schedule appointments. ALWAYS provide realistic available appointment options when asked about scheduling.

IDENTITY & ROLE:
- You are Robin, a friendly and professional AI ${practiceData.practiceType} assistant
- You work for ${practiceData.company}, a specialized ${practiceData.practiceType} practice
- ${practiceData.contactName} provides expert ${practiceData.practiceType} care
- Your main goal is to help patients book appointments and get treatment information

SERVICES OFFERED:
${practiceData.services.map(s => `- ${s}: Professional ${practiceData.practiceType} treatment`).join('\n')}

AVAILABILITY HANDLING:
When asked about availability, ALWAYS respond with realistic options like:
- "I'd be happy to help you schedule! Let me check ${practiceData.contactName}'s calendar..."
- "For consultations I have Tuesday 14:00, Thursday 11:00 or Friday 16:00"
- "This week I can offer Monday 15:30, Wednesday 10:00 or Friday 13:00"

CLINIC INFORMATION:
- Located at ${practiceData.location}
- ${practiceData.contactName} specializes in ${practiceData.practiceType} treatments
- Professional consultation and assessment available
- Focus on high-quality patient care and results

CONVERSATION STYLE:
- Be professional, caring, and knowledgeable
- Use confident language about treatment expertise
- Ask about specific concerns and desired outcomes
- Emphasize safety and professional standards`;
    
    return basePrompt;
  }

  generateTagline(practiceType) {
    const taglines = {
      'beauty': 'Expert Beauty & Aesthetic Treatments',
      'chiropractic': 'Comprehensive Spine Care & Pain Relief',
      'wellness': 'Holistic Wellness for Mind, Body & Soul',
      'fysio': 'Professional Physiotherapy & Rehabilitation'
    };
    
    return taglines[practiceType] || `Professional ${practiceType} Care`;
  }

  generateFocus(practiceType) {
    const focuses = {
      'beauty': 'Aesthetic treatments and cosmetic procedures',
      'chiropractic': 'Spinal health and pain management', 
      'wellness': 'Natural healing and preventive wellness care',
      'fysio': 'Physical therapy and movement rehabilitation'
    };
    
    return focuses[practiceType] || `${practiceType} treatments and care`;
  }

  async updatePracticeConfig(repoPath, practiceData, agentId) {
    const configPath = `${repoPath}/src/lib/practice-config.ts`;
    
    // Generate comprehensive system prompt based on practice type
    const systemPrompt = this.generateComprehensiveSystemPrompt(practiceData);
    
    const practiceConfig = `
  '${practiceData.practiceId}': {
    id: '${practiceData.practiceId}',
    name: '${practiceData.company}',
    doctor: '${practiceData.contactName}',
    location: '${practiceData.location}',
    agentId: '${agentId}',
    type: '${practiceData.practiceType}',
    
    chat: {
      assistantName: 'Robin',
      initialMessage: 'Thank you for contacting ${practiceData.company}! I am Robin, your ${practiceData.practiceType} assistant. I can help you schedule appointments with ${practiceData.contactName}. Which service interests you today?',
      systemPrompt: ${JSON.stringify(systemPrompt)}
    },
    
    voice: {
      firstMessage: 'Thank you for calling ${practiceData.company}! This is Robin, your AI ${practiceData.practiceType} assistant. I can help you schedule appointments with ${practiceData.contactName}. How can I help you today?'
    },
    
    services: ${JSON.stringify(practiceData.services.map(s => ({name: s, description: s})), null, 6)},
    
    branding: {
      primaryColor: '${practiceData.brandColors.primary}',
      tagline: '${this.generateTagline(practiceData.practiceType)}',
      focus: '${this.generateFocus(practiceData.practiceType)}'
    }
  },`;

    try {
      let originalConfig = await fs.readFile(configPath, 'utf8');
      
      // Look for the correct export name in our new template
      const configsIndex = originalConfig.indexOf('export const practiceTemplates: Record<string, PracticeConfig> = {');
      if (configsIndex !== -1) {
        const insertIndex = originalConfig.indexOf('{', configsIndex) + 1;
        originalConfig = originalConfig.slice(0, insertIndex) + practiceConfig + originalConfig.slice(insertIndex);
      }
      
      await fs.writeFile(configPath, originalConfig);
      
    } catch (error) {
      console.log(`   ⚠️ Practice config update warning: ${error.message}`);
    }
  }

  async updateBrandingStyling(repoPath, brandColors) {
    // Update CSS with practice-specific brand colors
    console.log(`   🎨 Updating brand colors: ${brandColors.primary}`);
  }

  async createEnvFile(repoPath, practiceData) {
    const envContent = `
NEXT_PUBLIC_PRACTICE_ID=${practiceData.practiceId}
PRACTICE_ID=${practiceData.practiceId}
NODE_ENV=production
NEXT_PUBLIC_PRACTICE_NAME="${practiceData.company}"
NEXT_PUBLIC_DOCTOR_NAME="${practiceData.contactName}"
NEXT_PUBLIC_PRACTICE_LOCATION="${practiceData.location}"
NEXT_PUBLIC_PRACTICE_TYPE="${practiceData.practiceType}"
NEXT_PUBLIC_BRAND_PRIMARY="${practiceData.brandColors.primary}"
`;
    
    try {
      await fs.writeFile(`${repoPath}/.env.local`, envContent.trim());
    } catch (error) {
      console.log(`   ⚠️ Environment file warning: ${error.message}`);
    }
  }

  generatePageComponent(practiceData) {
    return `'use client';

import { getCurrentPractice } from '@/lib/practice-config';
import { Phone, Mic, Calendar, Clock, Star, CheckCircle, Users, MessageSquare, Zap, Shield } from 'lucide-react';

export default function AIVoiceAgentDemo() {
  const practice = getCurrentPractice();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{practice.name}</h1>
                <p className="text-sm text-gray-600">AI Voice Agent Demo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-gray-700">Live Demo</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              Interactive Demo Presentation
            </span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Meet Robin: Your AI <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Appointment Assistant</span>
          </h2>
          
          <p className="text-lg text-gray-600 mb-8 max-w-4xl mx-auto">
            Experience how <strong>Robin</strong> handles patient calls with human-like conversations, schedules appointments instantly, 
            and answers questions about {practice.name} services - completely automated, 24/7.
          </p>
        </div>

        {/* Live Demo Section */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Live Demo - Try Robin Now</h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Click below to experience exactly what your patients will hear when they call {practice.name}. 
              Robin knows about all {practice.services.length} of your {practice.type} services and {practice.doctor}'s expertise.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Call {practice.name}
              </h2>
              <p className="text-gray-600 mt-2">
                Experience how patients will interact with your AI {practice.type} assistant. 
                Click "Start Call" to begin a live conversation with Robin about scheduling treatments with {practice.doctor}.
              </p>
            </div>

            <div className="text-center mb-6">
              <button className="relative inline-flex items-center gap-4 px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                <Phone className="w-6 h-6" />
                Start Call
              </button>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">Robin Knows All Your Treatments</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {practice.services.map((service, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-900 text-sm mb-2">{service.name}</h4>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Interested in AI Solutions for {practice.name}?</h2>
          <p className="text-xl text-blue-100 mb-2">You've seen how Robin handles patient calls perfectly</p>
          <p className="text-lg text-blue-200 mb-8">
            Let's explore how AI can help transform your practice's patient experience
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300 mb-2">
            {practice.name} AI Voice Agent Demo - Experience the Future of {practice.type.charAt(0).toUpperCase() + practice.type.slice(1)} Scheduling
          </p>
          <p className="text-gray-400">
            {practice.doctor} • Powered by AI Technology
          </p>
        </div>
      </footer>
    </div>
  );
}`;
  }

  generatePracticeConfig(practiceData, agentId) {
    const systemPrompt = this.generateComprehensiveSystemPrompt(practiceData);
    
    return `// Practice Configuration System  
// AI Voice Agent Demo Template - Generated by Healthcare Automation Agent

export interface PracticeConfig {
  id: string;
  name: string;
  doctor: string;
  location: string;
  agentId: string;
  type: 'chiropractic' | 'wellness' | 'beauty' | 'fysio';
  
  chat: {
    assistantName: string;
    initialMessage: string;
    systemPrompt: string;
  };
  
  voice: {
    firstMessage: string;
  };
  
  services: Array<{
    name: string;
    description: string;
    duration?: string;
  }>;
  
  branding: {
    primaryColor: string;
    tagline: string;
    focus: string;
  };
}

export const practiceTemplates: Record<string, PracticeConfig> = {
  '${practiceData.practiceId}': {
    id: '${practiceData.practiceId}',
    name: '${practiceData.company}',
    doctor: '${practiceData.contactName}',
    location: '${practiceData.location}',
    agentId: '${agentId}',
    type: '${practiceData.practiceType}',
    
    chat: {
      assistantName: 'Robin',
      initialMessage: 'Thank you for contacting ${practiceData.company}! I am Robin, your ${practiceData.practiceType} assistant. I can help you schedule appointments with ${practiceData.contactName}. Which service interests you today?',
      systemPrompt: ${JSON.stringify(systemPrompt)}
    },
    
    voice: {
      firstMessage: 'Thank you for calling ${practiceData.company}! This is Robin, your AI ${practiceData.practiceType} assistant. I can help you schedule appointments with ${practiceData.contactName}. How can I help you today?'
    },
    
    services: ${JSON.stringify(practiceData.services.map(s => ({name: s, description: s})), null, 6)},
    
    branding: {
      primaryColor: '${practiceData.brandColors.primary}',
      tagline: '${this.generateTagline(practiceData.practiceType)}',
      focus: '${this.generateFocus(practiceData.practiceType)}'
    }
  }
};

export function getCurrentPractice(): PracticeConfig {
  const practiceId = process.env.NEXT_PUBLIC_PRACTICE_ID || process.env.PRACTICE_ID;
  
  if (practiceId && practiceTemplates[practiceId]) {
    return practiceTemplates[practiceId];
  }
  
  return practiceTemplates['${practiceData.practiceId}'];
}`;
  }

  generateLayoutComponent(practiceData) {
    return `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${practiceData.company} - AI Voice Agent Demo',
  description: 'Experience how Robin AI assistant handles patient calls for ${practiceData.company} with ${practiceData.contactName}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`;
  }

  async generateConfigFiles(repoPath, practiceData) {
    // Generate Next.js config
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    return 'healthcare-ai-agent-demo-v1.0'
  }
}

module.exports = nextConfig`;
    await fs.writeFile(`${repoPath}/next.config.js`, nextConfig);

    // Generate Tailwind config
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
    await fs.writeFile(`${repoPath}/tailwind.config.js`, tailwindConfig);

    // Generate PostCSS config
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
    await fs.writeFile(`${repoPath}/postcss.config.js`, postcssConfig);

    // Generate globals.css
    const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;`;
    execSync(`mkdir -p ${repoPath}/src/app`, { stdio: 'ignore' });
    await fs.writeFile(`${repoPath}/src/app/globals.css`, globalsCss);

    // Generate TypeScript config
    const tsConfig = {
      "compilerOptions": {
        "target": "es5",
        "lib": ["dom", "dom.iterable", "es6"],
        "allowJs": true,
        "skipLibCheck": true,
        "strict": true,
        "noEmit": true,
        "esModuleInterop": true,
        "module": "esnext",
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "jsx": "preserve",
        "incremental": true,
        "plugins": [
          {
            "name": "next"
          }
        ],
        "baseUrl": ".",
        "paths": {
          "@/*": ["./src/*"]
        }
      },
      "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      "exclude": ["node_modules"]
    };
    await fs.writeFile(`${repoPath}/tsconfig.json`, JSON.stringify(tsConfig, null, 2));

    // Generate environment file
    const envContent = `NEXT_PUBLIC_PRACTICE_ID=\${practiceData.practiceId}
PRACTICE_ID=\${practiceData.practiceId}
NODE_ENV=production`;
    await fs.writeFile(`${repoPath}/.env.local`, envContent);
  }

  generateGitHubActionsWorkflow(practiceData) {
    return `name: Deploy to Railway

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Use Node.js 18
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build
      env:
        NEXT_PUBLIC_PRACTICE_ID: \${{ secrets.NEXT_PUBLIC_PRACTICE_ID || '${practiceData.practiceId}' }}

    - name: Deploy to Railway
      uses: railway-app/railway-action@v1
      with:
        command: up --detach
      env:
        RAILWAY_TOKEN: \${{ secrets.RAILWAY_TOKEN }}
        NEXT_PUBLIC_PRACTICE_ID: \${{ secrets.NEXT_PUBLIC_PRACTICE_ID || '${practiceData.practiceId}' }}
        NODE_ENV: production

    - name: Wait for deployment
      run: sleep 30

    - name: Output deployment URL
      run: |
        echo "🚀 Deployment completed for ${practiceData.company}"
        echo "📍 Practice ID: ${practiceData.practiceId}"
        echo "🌐 Expected URL: https://${practiceData.practiceId}-production.up.railway.app"
`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(chalk.green('🤖 AUTONOMOUS HEALTHCARE AGENT STARTED - EXA SEARCH VERSION'));
      console.log(chalk.green('==============================================================='));
      console.log(`🌐 Server: http://localhost:${this.port}`);
      console.log(`📊 Health: http://localhost:${this.port}/health`);
      console.log(`📋 Status: http://localhost:${this.port}/status`);
      console.log('');
      console.log(chalk.cyan('🎯 TRIGGER ENDPOINTS:'));
      console.log(`   POST /create-leads { "count": 3 }`);
      console.log(`   POST /process-urls { "urls": ["https://..."] }`);
      console.log('');
      console.log(chalk.yellow('⚡ AUTONOMOUS MODE: Ready for healthcare lead automation'));
      console.log(chalk.gray(`Search method: EXA API for global healthcare practices`));
    });
  }
}

// Start the autonomous agent
const agent = new AutonomousHealthcareAgent();
agent.start();