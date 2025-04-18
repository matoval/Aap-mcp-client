package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// App struct
type App struct {
	ctx context.Context
}

type ModelsResponse struct {
	Models []Model `json:"models"`
}

type Model struct {
	Name       string    `json:"name"`
	Model      string    `json:"model"`
	ModifiedAt time.Time `json:"modified_at"`
	Size       int64     `json:"size"`
	Digest     string    `json:"digest"`
	Details    Details   `json:"details"`
}

type Details struct {
	ParentModel       string   `json:"parent_model"`
	Format            string   `json:"format"`
	Family            string   `json:"family"`
	Families          []string `json:"families"`
	ParameterSize     string   `json:"parameter_size"`
	QuantizationLevel string   `json:"quantization_level"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) GetModels(ollamaUrl string) (*ModelsResponse, error) {
	resp, err := http.Get(ollamaUrl + "/api/tags")
	if err != nil {
		fmt.Println("Error getting ollama model lists, with err: ", err)
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var data ModelsResponse
	err = json.Unmarshal(body, &data)
	if err != nil {
		fmt.Println("Error decofing JSON:", err)
	}

	return &data, nil
}
