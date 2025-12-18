"""
{{PROJECT_NAME}} - PyTorch Deep Learning Project
"""
import torch
import torch.nn as nn
import torch.optim as optim


class SimpleNet(nn.Module):
    """A simple neural network for demonstration."""
    
    def __init__(self, input_size=10, hidden_size=20, output_size=2):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_size, output_size),
        )
    
    def forward(self, x):
        return self.model(x)


def train_model(model, data, labels, epochs=100):
    """Train the model."""
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    for epoch in range(epochs):
        optimizer.zero_grad()
        outputs = model(data)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        if (epoch + 1) % 10 == 0:
            print(f"Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.4f}")
    
    return model


def main():
    """Main entry point."""
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    
    # Create sample data
    torch.manual_seed(42)
    data = torch.randn(100, 10)
    labels = torch.randint(0, 2, (100,))
    
    # Create and train model
    model = SimpleNet()
    print(f"\nModel architecture:\n{model}")
    
    print("\nTraining...")
    model = train_model(model, data, labels)
    
    print("\nDone!")


if __name__ == "__main__":
    main()
