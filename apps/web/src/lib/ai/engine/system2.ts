
import { Groq } from 'groq-sdk';

interface System2Result {
    response: string;
    reasoningContent: string;
}

/**
 * Executes the System 2 Iterative Reasoning Loop
 * 1. Draft
 * 2. Critique
 * 3. Refine
 */
export async function executeSystem2Loop(
    groq: Groq,
    model: string,
    messages: any[],
    temperature: number,
    topP: number,
    identityName: string = 'Kişilik'
): Promise<System2Result> {

    // Step 1: Draft
    const draftCompletion = await groq.chat.completions.create({
        model,
        messages,
        max_tokens: 1024,
        temperature: temperature,
        top_p: topP
    });
    const draft = draftCompletion.choices[0]?.message?.content || '';

    // Step 2: Self-Critique
    const critiquePrompt = `
Lütfen yukarıdaki taslak yanıtı şu kriterlere göre eleştir:
1. ${identityName} karakterine tam uygun mu?
2. Geçmiş söylemlerle çelişiyor mu?
3. Mantıksal bir hata var mı?
4. Kullanıcının gizli niyetini (Intent) doğru karşıladı mı?

Sadece eleştirileri listele. Eğer sorun yoksa "UYGUN" yaz.`;

    const critiqueMessages = [
        ...messages,
        { role: 'assistant', content: draft },
        { role: 'system', content: critiquePrompt }
    ] as any[];

    const critiqueCompletion = await groq.chat.completions.create({
        // Always use a capable model for critique regardless of mode
        model: 'llama-3.3-70b-versatile',
        messages: critiqueMessages,
        max_tokens: 512,
        temperature: 0.1 // Low temp for analytics
    });
    const critique = critiqueCompletion.choices[0]?.message?.content || '';

    // Step 3: Refine Check
    if (critique.includes('UYGUN') || critique.length < 10) {
        return {
            response: draft,
            reasoningContent: `__DRAFT__:\n${draft}\n\n__CRITIQUE__:\nLooks good. (Pass)`
        };
    }

    // Step 4: Refine
    const refinePrompt = `
Eleştirileri dikkate alarak yanıtı yeniden yaz. 
- Daha tutarlı ve karakterle uyumlu olsun.
- Sadece nihai yanıtı ver, açıklama yapma.`;

    const refineMessages = [
        ...critiqueMessages,
        { role: 'assistant', content: critique },
        { role: 'system', content: refinePrompt }
    ] as any[];

    const refineCompletion = await groq.chat.completions.create({
        model, // Use original model for generation style
        messages: refineMessages,
        max_tokens: 1024,
        temperature: temperature, // Maintain creativity of original intent
        top_p: topP
    });
    const refinedResponse = refineCompletion.choices[0]?.message?.content || draft;

    return {
        response: refinedResponse,
        reasoningContent: `__DRAFT__:\n${draft}\n\n__CRITIQUE__:\n${critique}\n\n__REFINED__:\n${refinedResponse}`
    };
}
