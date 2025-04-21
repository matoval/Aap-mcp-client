package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"
)

// App struct
type App struct {
	ctx context.Context
	MCPClient *client.Client
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

	c, err := client.NewStdioMCPClient(
		"./aap-mcp-server",
		[]string{},
	)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	a.MCPClient = c

	// Initialize the client
	fmt.Println("Initializing client...")
	initRequest := mcp.InitializeRequest{}
	initRequest.Params.ProtocolVersion = mcp.LATEST_PROTOCOL_VERSION
	initRequest.Params.ClientInfo = mcp.Implementation{
		Name:    "AAP Controller",
		Version: "0.1.0",
	}

	initResult, err := c.Initialize(ctx, initRequest)
	if err != nil {
		log.Fatalf("Failed to initialize: %v", err)
	}
	fmt.Printf(
		"Initialized with server: %s %s\n\n",
		initResult.ServerInfo.Name,
		initResult.ServerInfo.Version,
	)

	go func(ctx context.Context) {
		for {
			select {
			case <-ctx.Done():
				fmt.Println("Mcp server closed")
				c.Close()
				return
			default:
				time.Sleep(500*time.Millisecond)
			}
		}
	}(a.ctx)
}

func (a *App) GetToolList() (*mcp.ListToolsResult, error) {
	// List Tools
	fmt.Println("Listing available tools...")
	toolsRequest := mcp.ListToolsRequest{}
	tools, err := a.MCPClient.ListTools(a.ctx, toolsRequest)
	if err != nil {
		return nil, err
	}
	for _, tool := range tools.Tools {
		fmt.Printf("- %s: %s\n", tool.Name, tool.Description)
	}

	return tools, nil
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
