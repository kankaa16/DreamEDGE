package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

func GenerateFantasyCoachReport(
	ctx context.Context,
	autopsies any,
) (string, error) {

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("GEMINI_API_KEY is not configured")
	}

	autopsyJSON, err := json.Marshal(autopsies)
	if err != nil {
		return "", fmt.Errorf("failed to encode autopsy history: %w", err)
	}

	prompt := fmt.Sprintf(`
You are DreamEdge Fantasy Coach, an expert fantasy cricket analyst.

Your task is to analyse a user's fantasy cricket performance across
multiple completed matches and provide personalised coaching insights.

Here is the user's historical fantasy match data:

%s

STRICT RESPONSE RULES:
- Maximum 150 words total.
- No greeting or introduction.
- No match-by-match breakdown.
- No long paragraphs.
- No listing every missed player.
- Maximum 2 strengths.
- Maximum 2 improvement areas.
- Exactly 3 short next-match tips.
- One sentence for the final verdict.
- Each bullet must be concise and actionable.
- Use only information present in the supplied autopsy data.

Return exactly:

## Strengths
## Improvement Areas
## Next Match Tips
## Coach Verdict

`, string(autopsyJSON))

	payload := GeminiRequest{
		Contents: []GeminiContent{
			{
				Parts: []GeminiPart{
					{Text: prompt},
				},
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to encode Gemini request: %w", err)
	}

	model := os.Getenv("GEMINI_MODEL")
	if model == "" {
		model = "gemini-2.5-flash"
	}

	url := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
		model,
		apiKey,
	)

	request, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		url,
		bytes.NewBuffer(body),
	)
	if err != nil {
		return "", fmt.Errorf("failed to create Gemini request: %w", err)
	}

	request.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 35 * time.Second,
	}

	response, err := client.Do(request)
	if err != nil {
		return "", fmt.Errorf("Gemini API request failed: %w", err)
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read Gemini response: %w", err)
	}

	if response.StatusCode != http.StatusOK {
		return "", fmt.Errorf(
			"Gemini API returned status %d: %s",
			response.StatusCode,
			string(responseBody),
		)
	}

	var geminiResponse GeminiResponse

	if err := json.Unmarshal(responseBody, &geminiResponse); err != nil {
		return "", fmt.Errorf("failed to parse Gemini response: %w", err)
	}

	if len(geminiResponse.Candidates) == 0 ||
		len(geminiResponse.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("Gemini returned an empty response")
	}

	var report strings.Builder

	for _, part := range geminiResponse.Candidates[0].Content.Parts {
		report.WriteString(part.Text)
	}

	result := strings.TrimSpace(report.String())

	if result == "" {
		return "", fmt.Errorf("Gemini returned an empty report")
	}

	return result, nil
}
