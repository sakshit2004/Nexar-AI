"""
Production LLM prompts with chain-of-thought reasoning
"""


def get_match_prompt(user_profile: dict, grant_data: dict) -> str:
    """Prompt for grant matching with fit score"""
    return f"""You are an expert grant advisor. Analyze this grant for fit with the user's profile.

STEP 1: Identify the grant's target recipients (who can apply)
STEP 2: Identify the grant's focus area (what it funds)
STEP 3: Compare requirements to user profile
STEP 4: Assign a fit score (1-100)

SCORING GUIDELINES:
- 90-100: Excellent fit, highly recommended
- 70-89: Good fit, worth exploring
- 50-69: Possible fit, some barriers exist
- 30-49: Poor fit, major mismatches
- 1-29: Not suitable, fundamental incompatibility

USER PROFILE:
- Organization Type: {user_profile.get('organization_type', 'Not specified')}
- Focus Areas: {', '.join(user_profile.get('focus_areas', []))}
- Location: {user_profile.get('location_state', 'Not specified')}
- Grant Amount: ${user_profile.get('grant_amount_min', 0):,} - ${user_profile.get('grant_amount_max', 0):,}
- Keywords: {user_profile.get('keywords', 'None')}

GRANT:
Title: {grant_data['title']}
Agency: {grant_data['agency']}
Award Range: ${grant_data.get('award_floor', 0):,} - ${grant_data.get('award_ceiling', 0):,}

Description (first 2000 chars):
{grant_data.get('description', '')[:2000]}

Eligibility (first 1000 chars):
{grant_data.get('eligibility', '')[:1000]}

OUTPUT (valid JSON only):
{{
  "score": <number 1-100>,
  "reasoning": "<2-3 sentence explanation>",
  "match_factors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "barriers": ["<barrier 1>", "<barrier 2>"] or []
}}"""


def get_summary_prompt(grant_data: dict) -> str:
    """Prompt for plain-English grant summary"""
    return f"""You are translating a government grant into simple language for a busy nonprofit director.

GRANT TEXT:
Title: {grant_data['title']}
Agency: {grant_data['agency']}
Award Range: ${grant_data.get('award_floor', 0):,} - ${grant_data.get('award_ceiling', 0):,}
Close Date: {grant_data.get('close_date', 'Not specified')}

Description:
{grant_data.get('description', 'Not provided')}

Eligibility:
{grant_data.get('eligibility', 'Not provided')}

TASK:
Generate a 150-word summary covering:
1. PURPOSE: What does this grant fund? (1 sentence, 8th-grade reading level)
2. ELIGIBILITY: Who can apply? (3-5 bullets, use "You can apply if...")
3. KEY REQUIREMENTS: What must applicants provide? (3-5 bullets)
4. DEADLINE: Application due date
5. RED FLAGS: Tricky requirements or common pitfalls (1-2 bullets or "None identified")

RULES:
- Use simple language (no jargon unless necessary - then explain it)
- Be specific (no vague terms like "eligible entities")
- If unclear, say "The description doesn't specify [X]. Contact [agency]."
- Focus on actionable info (what they need to DO)

OUTPUT (valid JSON only):
{{
  "purpose": "<1 sentence>",
  "eligibility": ["<bullet 1>", "<bullet 2>", "<bullet 3>"],
  "requirements": ["<bullet 1>", "<bullet 2>", "<bullet 3>"],
  "deadline": "<date and time>",
  "red_flags": ["<bullet 1>"] or []
}}"""


def get_chat_prompt(grant_data: dict, user_question: str, chat_history: list = None) -> list:
    """Prompt for grant Q&A chat"""
    messages = [
        {
            "role": "system",
            "content": """You are a grant advisor assistant helping nonprofits understand federal grants.

Rules:
- Answer questions based ONLY on the grant text provided
- If the grant text doesn't specify something, say so and suggest contacting the agency
- Provide specific examples when helpful
- Keep answers concise (2-3 paragraphs max)
- Use simple language"""
        }
    ]
    
    # Add chat history if provided
    if chat_history:
        messages.extend(chat_history)
    
    # Add current grant context and question
    messages.append({
        "role": "user",
        "content": f"""GRANT CONTEXT:
Title: {grant_data['title']}
Agency: {grant_data['agency']}

Full Description:
{grant_data.get('full_text', grant_data.get('description', ''))}

USER QUESTION: {user_question}

Answer the question based on the grant text above."""
    })
    
    return messages


def get_checklist_prompt(grant_data: dict) -> str:
    """Prompt for generating application checklist"""
    return f"""Based on this grant's requirements, generate a 5-7 step action checklist to start the application process.

GRANT:
Title: {grant_data['title']}
Agency: {grant_data['agency']}
Close Date: {grant_data.get('close_date', 'Not specified')}

Requirements:
{grant_data.get('eligibility', 'Not provided')}

{grant_data.get('description', 'Not provided')[:1500]}

OUTPUT (valid JSON only):
{{
  "checklist": [
    "Step 1: <specific actionable task>",
    "Step 2: <specific actionable task>",
    "Step 3: <specific actionable task>",
    "Step 4: <specific actionable task>",
    "Step 5: <specific actionable task>"
  ]
}}

Make steps specific and actionable (not vague like "Read the requirements")."""

