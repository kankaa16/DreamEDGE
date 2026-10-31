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

type MatchReportRequest struct {
	Match   string `json:"match"`
	Format  string `json:"format"`
	IsDemo  bool   `json:"is_demo"`
	Autopsy any    `json:"autopsy"`
}

type MatchReportResponse struct {
	Report string `json:"report"`
}

type GeminiRequest struct {
	Contents []GeminiContent `json:"contents"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []GeminiPart `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func GenerateMatchReport(
	ctx context.Context,
	request MatchReportRequest,
) (MatchReportResponse, error) {

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return MatchReportResponse{}, fmt.Errorf("GEMINI_API_KEY is not configured")
	}

	autopsyJSON, err := json.Marshal(request.Autopsy)
	if err != nil {
		return MatchReportResponse{}, fmt.Errorf("failed to encode autopsy data: %w", err)
	}

	prompt := fmt.Sprintf(`
You are DreamEdge, an expert fantasy cricket analyst.

Write a clear, insightful post-match fantasy report using ONLY the
provided match and autopsy data.

MATCH: %s
FORMAT: %s
DEMO DATA: %t

AUTOPSY DATA:
%s

Structure your report using these sections:

1. Match Overview
   Briefly summarize the fantasy team's overall performance.

2. Top Performers
   Explain which selected players contributed most to the team's score.

3. Weakest Performers
   Identify underperforming selections using the supplied statistics.

4. Captaincy Analysis
   Explain whether the captain and vice-captain choices were effective.
   Mention points gained or lost only if provided.

5. Selection Analysis
   Explain the biggest missed opportunities and recommended replacements.
   Use only replacements present in the data.

6. Final Verdict
   Give a concise assessment and actionable lessons for the next match.

STRICT RULES:
- Never invent player statistics, points, events, or match details.
- Never calculate or modify fantasy points.
- Do not claim a player was injured, out of form, or responsible for a loss
  unless the data explicitly supports it.
- Distinguish between actual team points and hypothetical best possible points.
- If information is missing, simply omit that detail.
- Keep the tone analytical, friendly, and easy to understand.
- If DEMO DATA is true, clearly mention that this is a demonstration report
  based on synthetic/demo match data.
- Return only the report in Markdown. No introductory explanation.
`, request.Match, request.Format, request.IsDemo, string(autopsyJSON))

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
		return MatchReportResponse{}, fmt.Errorf("failed to encode Gemini request: %w", err)
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

	httpRequest, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		url,
		bytes.NewBuffer(body),
	)
	if err != nil {
		return MatchReportResponse{}, fmt.Errorf("failed to create Gemini request: %w", err)
	}

	httpRequest.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	response, err := client.Do(httpRequest)
	if err != nil {
		return MatchReportResponse{}, fmt.Errorf("Gemini API request failed: %w", err)
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		return MatchReportResponse{}, fmt.Errorf("failed to read Gemini response: %w", err)
	}

	if response.StatusCode != http.StatusOK {
		return MatchReportResponse{}, fmt.Errorf(
			"Gemini API returned status %d: %s",
			response.StatusCode,
			string(responseBody),
		)
	}

	var geminiResponse GeminiResponse

	if err := json.Unmarshal(responseBody, &geminiResponse); err != nil {
		return MatchReportResponse{}, fmt.Errorf("failed to parse Gemini response: %w", err)
	}

	if len(geminiResponse.Candidates) == 0 ||
		len(geminiResponse.Candidates[0].Content.Parts) == 0 {
		return MatchReportResponse{}, fmt.Errorf("Gemini returned an empty report")
	}

	var report strings.Builder

	for _, part := range geminiResponse.Candidates[0].Content.Parts {
		report.WriteString(part.Text)
	}

	generatedReport := strings.TrimSpace(report.String())

	if generatedReport == "" {
		return MatchReportResponse{}, fmt.Errorf("Gemini returned an empty report")
	}

	return MatchReportResponse{
		Report: generatedReport,
	}, nil
}
